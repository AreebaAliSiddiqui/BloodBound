const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMPONENTS = ['Whole Blood', 'Packed RBCs', 'Platelets', 'Plasma'];
// Days each component stays usable after collection.
const SHELF_LIFE_DAYS = { 'Whole Blood': 35, 'Packed RBCs': 42, 'Platelets': 5, 'Plasma': 365 };
const OPEN_STATUSES = ['Published', 'Ongoing', 'Completed'];

router.use(verifyToken, authorizeRoles('camp_organizer'));
router.param('id', (req, res, next, id) => {
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid camp id.' });
    next();
});

// GET /api/attendance/camps/:id/roster
router.get('/camps/:id/roster', async (req, res) => {
    try {
        const camp = await pool.query('SELECT camp_id FROM camps WHERE camp_id = $1 AND organizer_id = $2',
            [req.params.id, req.user.user_id]);
        if (camp.rows.length === 0) return res.status(404).json({ error: 'Camp not found.' });
        const result = await pool.query(
            `SELECT a.appointment_id, a.slot_time, a.attended, a.donated,
                    u.name, u.phone, d.blood_group
             FROM camp_appointments a
             JOIN donor_profiles d ON d.donor_id = a.donor_id
             JOIN users u ON u.user_id = d.user_id
             WHERE a.camp_id = $1 ORDER BY a.slot_time`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Roster Error:', err.message);
        res.status(500).json({ error: 'Server error loading roster.' });
    }
});

// POST /api/attendance/camps/:id/checkin  Body: { appointment_id }
router.post('/camps/:id/checkin', async (req, res) => {
    const { appointment_id } = req.body;
    if (!appointment_id || !UUID_RE.test(appointment_id)) return res.status(400).json({ error: 'A valid appointment_id is required.' });
    try {
        const result = await pool.query(
            `UPDATE camp_appointments a SET attended = TRUE
             FROM camps c
             WHERE a.appointment_id = $1 AND a.camp_id = $2
               AND c.camp_id = a.camp_id AND c.organizer_id = $3 AND c.status = ANY($4::camp_status[])
             RETURNING a.appointment_id, a.attended`,
            [appointment_id, req.params.id, req.user.user_id, OPEN_STATUSES]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found for your camp, or the camp is not open.' });
        }
        res.json({ message: 'Donor checked in.', appointment: result.rows[0] });
    } catch (err) {
        console.error('Check-in Error:', err.message);
        res.status(500).json({ error: 'Server error during check-in.' });
    }
});

// POST /api/attendance/camps/:id/donation  Body: { appointment_id, component? }
// Adds a unit to blood inventory and updates the donor's last donation date.
router.post('/camps/:id/donation', async (req, res) => {
    const { appointment_id } = req.body;
    const component = req.body.component || 'Whole Blood';
    if (!appointment_id || !UUID_RE.test(appointment_id)) return res.status(400).json({ error: 'A valid appointment_id is required.' });
    if (!COMPONENTS.includes(component)) return res.status(400).json({ error: 'Invalid component.' });

    const client = await pool.connect();
    const fail = async (code, error) => { await client.query('ROLLBACK').catch(() => {}); return res.status(code).json({ error }); };
    try {
        await client.query('BEGIN');
        const a = await client.query(
            `SELECT a.appointment_id, a.attended, a.donated, a.donor_id, d.blood_group, c.status
             FROM camp_appointments a
             JOIN camps c ON c.camp_id = a.camp_id
             JOIN donor_profiles d ON d.donor_id = a.donor_id
             WHERE a.appointment_id = $1 AND a.camp_id = $2 AND c.organizer_id = $3
             FOR UPDATE OF a`,
            [appointment_id, req.params.id, req.user.user_id]
        );
        if (a.rows.length === 0) return fail(404, 'Appointment not found for your camp.');
        const ap = a.rows[0];
        if (!OPEN_STATUSES.includes(ap.status)) return fail(409, 'The camp is not open.');
        if (!ap.attended) return fail(409, 'Check the donor in first.');
        if (ap.donated) return fail(409, 'A donation is already recorded for this appointment.');

        const unit = await client.query(
            `INSERT INTO blood_inventory (blood_group, component, source_camp_id, expiry_date)
             VALUES ($1, $2, $3, CURRENT_DATE + $4::int)
             RETURNING unit_id, blood_group, component, expiry_date`,
            [ap.blood_group, component, req.params.id, SHELF_LIFE_DAYS[component]]
        );
        await client.query('UPDATE camp_appointments SET donated = TRUE WHERE appointment_id = $1', [appointment_id]);
        await client.query(
            'UPDATE donor_profiles SET last_donation_date = CURRENT_DATE, is_eligible = FALSE WHERE donor_id = $1',
            [ap.donor_id]
        );
        await client.query('COMMIT');
        res.status(201).json({ message: 'Donation recorded.', unit: unit.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Donation Error:', err.message);
        res.status(500).json({ error: 'Server error recording donation.' });
    } finally {
        client.release();
    }
});

module.exports = router;
