const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
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

module.exports = router;
