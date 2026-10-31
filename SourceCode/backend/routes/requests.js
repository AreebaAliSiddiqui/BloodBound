const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { computeEligibility } = require('../utils/eligibility');
const { matchDonors, expireOverdueRequests } = require('../services/matching');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Packed RBCs', 'Platelets', 'Plasma'];
const URGENCY_ALIASES = {
    'critical': 'Level 1 - Stat', 'level 1 - stat': 'Level 1 - Stat',
    'high': 'Level 2 - Urgent', 'level 2 - urgent': 'Level 2 - Urgent',
    'normal': 'Routine', 'routine': 'Routine'
};
// Hours until a request auto-expires, by urgency.
const EXPIRY_HOURS = { 'Level 1 - Stat': 4, 'Level 2 - Urgent': 12, 'Routine': 24 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(verifyToken);

router.param('id', (req, res, next, id) => {
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid request id.' });
    next();
});

const refreshExpiry = () => expireOverdueRequests().catch((e) => console.error('Expiry error:', e.message));

// ---------- HOSPITAL STAFF ----------

// POST /api/requests : create a request and auto-match donors
router.post('/', authorizeRoles('hospital_staff'), async (req, res) => {
    const b = req.body;
    const urgency = URGENCY_ALIASES[String(b.urgency || 'Level 2 - Urgent').toLowerCase()];
    const units = parseInt(b.units_required, 10);

    if (!b.patient_identifier || !b.city || !b.hospital_name || !b.hospital_address) {
        return res.status(400).json({ error: 'patient_identifier, city, hospital_name and hospital_address are required.' });
    }
    if (!BLOOD_GROUPS.includes(b.blood_group)) return res.status(400).json({ error: 'Invalid blood_group.' });
    if (!COMPONENTS.includes(b.component)) return res.status(400).json({ error: 'Invalid component.' });
    if (!urgency) return res.status(400).json({ error: 'Invalid urgency. Use Critical, High or Normal.' });
    if (!Number.isInteger(units) || units < 1 || units > 10) {
        return res.status(400).json({ error: 'units_required must be between 1 and 10.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const inserted = await client.query(
            `INSERT INTO hospital_requests
                (hospital_id, patient_identifier, blood_group, component, units_required, urgency,
                 city, hospital_name, hospital_address, latitude, longitude, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() + make_interval(hours => $12))
             RETURNING *`,
            [req.user.user_id, b.patient_identifier, b.blood_group, b.component, units, urgency,
             b.city, b.hospital_name, b.hospital_address, b.latitude ?? null, b.longitude ?? null,
             EXPIRY_HOURS[urgency]]
        );
        const request = inserted.rows[0];
        const matched = await matchDonors(client, request);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Request created.', request, donors_alerted: matched });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Create Request Error:', err.message);
        res.status(500).json({ error: 'Server error creating request.' });
    } finally {
        client.release();
    }
});

// GET /api/requests : my requests with live counts
router.get('/', authorizeRoles('hospital_staff'), async (req, res) => {
    try {
        await refreshExpiry();
        const result = await pool.query(
            `SELECT r.request_id, r.blood_group, r.component, r.units_required, r.urgency, r.status,
                    r.city, r.hospital_name, r.expires_at, r.created_at,
                    (SELECT COUNT(*)::int FROM matching_logs m WHERE m.request_id = r.request_id) AS donors_alerted,
                    (SELECT COUNT(*)::int FROM matching_logs m
                      WHERE m.request_id = r.request_id AND m.response_status = 'Accepted') AS donors_accepted
             FROM hospital_requests r
             WHERE r.hospital_id = $1
             ORDER BY r.created_at DESC`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('List Requests Error:', err.message);
        res.status(500).json({ error: 'Server error listing requests.' });
    }
});

// ---------- DONOR ALERTS (must be before /:id) ----------

// GET /api/requests/alerts : requests matched to me. Contact details stay hidden until I accept.
router.get('/alerts', authorizeRoles('donor'), async (req, res) => {
    try {
        await refreshExpiry();
        const result = await pool.query(
            `SELECT r.request_id, r.blood_group, r.component, r.units_required, r.urgency, r.status,
                    r.city, r.hospital_name, r.expires_at, r.created_at,
                    m.response_status,
                    CASE WHEN m.response_status = 'Accepted' THEN r.hospital_address END AS hospital_address,
                    CASE WHEN m.response_status = 'Accepted' THEN hu.phone END AS hospital_contact
             FROM matching_logs m
             JOIN donor_profiles d ON d.donor_id = m.donor_id
             JOIN hospital_requests r ON r.request_id = m.request_id
             JOIN users hu ON hu.user_id = r.hospital_id
             WHERE d.user_id = $1
               AND r.status IN ('Pending', 'Matching')
               AND r.expires_at > NOW()
             ORDER BY r.created_at DESC`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Alerts Error:', err.message);
        res.status(500).json({ error: 'Server error fetching alerts.' });
    }
});

// ---------- HOSPITAL: single request ----------

// GET /api/requests/:id : details + accepted donors (their contact is visible only after they accept)
router.get('/:id', authorizeRoles('hospital_staff'), async (req, res) => {
    try {
        await refreshExpiry();
        const r = await pool.query(
            'SELECT * FROM hospital_requests WHERE request_id = $1 AND hospital_id = $2',
            [req.params.id, req.user.user_id]
        );
        if (r.rows.length === 0) return res.status(404).json({ error: 'Request not found.' });

        const counts = await pool.query(
            `SELECT COUNT(*)::int AS donors_alerted,
                    COUNT(*) FILTER (WHERE response_status = 'Accepted')::int AS donors_accepted
             FROM matching_logs WHERE request_id = $1`, [req.params.id]);
        const accepted = await pool.query(
            `SELECT u.name, u.phone, d.blood_group
             FROM matching_logs m
             JOIN donor_profiles d ON d.donor_id = m.donor_id
             JOIN users u ON u.user_id = d.user_id
             WHERE m.request_id = $1 AND m.response_status = 'Accepted'`, [req.params.id]);

        res.json({ request: r.rows[0], ...counts.rows[0], accepted_donors: accepted.rows });
    } catch (err) {
        console.error('Get Request Error:', err.message);
        res.status(500).json({ error: 'Server error fetching request.' });
    }
});

// PUT /api/requests/:id/cancel
router.put('/:id/cancel', authorizeRoles('hospital_staff'), async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE hospital_requests SET status = 'Cancelled'
             WHERE request_id = $1 AND hospital_id = $2 AND status IN ('Pending', 'Matching')
             RETURNING request_id, status`,
            [req.params.id, req.user.user_id]
        );
        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Request not found or can no longer be cancelled.' });
        }
        res.json({ message: 'Request cancelled.', request: result.rows[0] });
    } catch (err) {
        console.error('Cancel Error:', err.message);
        res.status(500).json({ error: 'Server error cancelling request.' });
    }
});

// PUT /api/requests/:id/fulfill : hospital confirms donation. Updates donors' last donation date.
router.put('/:id/fulfill', authorizeRoles('hospital_staff'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const r = await client.query(
            'SELECT status FROM hospital_requests WHERE request_id = $1 AND hospital_id = $2 FOR UPDATE',
            [req.params.id, req.user.user_id]
        );
        if (r.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found.' });
        }
        if (r.rows[0].status !== 'Matching') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Only requests with accepted donors can be fulfilled.' });
        }
        await client.query(
            `UPDATE donor_profiles SET last_donation_date = CURRENT_DATE, is_eligible = FALSE
             WHERE donor_id IN (SELECT donor_id FROM matching_logs
                                WHERE request_id = $1 AND response_status = 'Accepted')`,
            [req.params.id]
        );
        await client.query(
            `UPDATE matching_logs SET response_status = 'Donated'
             WHERE request_id = $1 AND response_status = 'Accepted'`, [req.params.id]);
        await client.query(`UPDATE hospital_requests SET status = 'Fulfilled' WHERE request_id = $1`, [req.params.id]);
        await client.query('COMMIT');
        res.json({ message: 'Request fulfilled. Donor records updated.' });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Fulfill Error:', err.message);
        res.status(500).json({ error: 'Server error fulfilling request.' });
    } finally {
        client.release();
    }
});

// ---------- DONOR: accept / withdraw ----------

// POST /api/requests/:id/accept
router.post('/:id/accept', authorizeRoles('donor'), async (req, res) => {
    const client = await pool.connect();
    const fail = async (code, msg) => { await client.query('ROLLBACK').catch(() => {}); return res.status(code).json({ error: msg }); };
    try {
        await client.query('BEGIN');
        const r = await client.query(
            `SELECT r.*, hu.phone AS hospital_contact
             FROM hospital_requests r JOIN users hu ON hu.user_id = r.hospital_id
             WHERE r.request_id = $1 FOR UPDATE OF r`, [req.params.id]);
        if (r.rows.length === 0) return fail(404, 'Request not found.');
        const request = r.rows[0];
        if (!['Pending', 'Matching'].includes(request.status) || new Date(request.expires_at) < new Date()) {
            return fail(409, 'This request is no longer open.');
        }

        const d = await client.query('SELECT donor_id, last_donation_date FROM donor_profiles WHERE user_id = $1', [req.user.user_id]);
        if (d.rows.length === 0) return fail(404, 'Donor profile not found.');
        const donor = d.rows[0];
        if (!computeEligibility(donor.last_donation_date).eligible) return fail(403, 'You are not eligible to donate yet.');

        const log = await client.query(
            'SELECT response_status FROM matching_logs WHERE request_id = $1 AND donor_id = $2 FOR UPDATE',
            [req.params.id, donor.donor_id]);
        if (log.rows.length === 0) return fail(403, 'This request was not matched to you.');
        if (log.rows[0].response_status === 'Accepted') return fail(409, 'You have already accepted this request.');

        const count = await client.query(
            `SELECT COUNT(*)::int AS n FROM matching_logs WHERE request_id = $1 AND response_status = 'Accepted'`, [req.params.id]);
        if (count.rows[0].n >= request.units_required) return fail(409, 'Enough donors have already accepted.');

        await client.query(
            `UPDATE matching_logs SET response_status = 'Accepted' WHERE request_id = $1 AND donor_id = $2`,
            [req.params.id, donor.donor_id]);
        await client.query(`UPDATE hospital_requests SET status = 'Matching' WHERE request_id = $1`, [req.params.id]);
        await client.query('COMMIT');

        res.json({
            message: 'Thank you! Request accepted.',
            hospital_name: request.hospital_name,
            hospital_address: request.hospital_address,
            hospital_contact: request.hospital_contact
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Accept Error:', err.message);
        res.status(500).json({ error: 'Server error accepting request.' });
    } finally {
        client.release();
    }
});

// POST /api/requests/:id/withdraw : donor cancels a previous acceptance
router.post('/:id/withdraw', authorizeRoles('donor'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT 1 FROM hospital_requests WHERE request_id = $1 FOR UPDATE', [req.params.id]);
        const updated = await client.query(
            `UPDATE matching_logs SET response_status = 'Withdrawn'
             WHERE request_id = $1 AND response_status = 'Accepted'
               AND donor_id = (SELECT donor_id FROM donor_profiles WHERE user_id = $2)
             RETURNING log_id`, [req.params.id, req.user.user_id]);
        if (updated.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'You have not accepted this request.' });
        }
        // If nobody is left, the request goes back to Open (Pending).
        await client.query(
            `UPDATE hospital_requests SET status = 'Pending'
             WHERE request_id = $1 AND status = 'Matching'
               AND NOT EXISTS (SELECT 1 FROM matching_logs WHERE request_id = $1 AND response_status = 'Accepted')`,
            [req.params.id]);
        await client.query('COMMIT');
        res.json({ message: 'Acceptance withdrawn.' });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Withdraw Error:', err.message);
        res.status(500).json({ error: 'Server error withdrawing.' });
    } finally {
        client.release();
    }
});

module.exports = router;
