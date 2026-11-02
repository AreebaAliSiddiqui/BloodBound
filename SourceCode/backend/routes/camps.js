const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { refreshCampStatuses } = require('../services/camps');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(verifyToken);
router.param('id', (req, res, next, id) => {
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid camp id.' });
    next();
});

const refresh = () => refreshCampStatuses().catch((e) => console.error('Camp status error:', e.message));

function validateCamp(v, checkFuture) {
    if (!v.camp_name || v.camp_name.length < 5 || v.camp_name.length > 100) return 'camp_name must be 5-100 characters.';
    if (!v.location_address || !v.city) return 'location_address and city are required.';
    const s = new Date(v.start_time), e = new Date(v.end_time);
    if (isNaN(s) || isNaN(e)) return 'start_time and end_time must be valid dates.';
    if (checkFuture && s <= new Date()) return 'start_time must be in the future.';
    if (e <= s) return 'end_time must be after start_time.';
    if (!Number.isInteger(v.max_capacity) || v.max_capacity < 10 || v.max_capacity > 1000) return 'max_capacity must be between 10 and 1000.';
    if (!Number.isInteger(v.target_units) || v.target_units < 1) return 'target_units must be at least 1.';
    return null;
}

const STATS_SQL = `
    SELECT c.camp_id, c.camp_name, c.location_address, c.city, c.start_time, c.end_time,
           c.status, c.max_capacity, c.target_units,
           COUNT(a.appointment_id)::int AS booked,
           COUNT(a.appointment_id) FILTER (WHERE a.attended)::int AS checked_in,
           (SELECT COUNT(*)::int FROM blood_inventory b WHERE b.source_camp_id = c.camp_id) AS units_collected
    FROM camps c LEFT JOIN camp_appointments a ON a.camp_id = c.camp_id`;

// GET /api/camps : discovery of published/ongoing camps (any logged-in user). Optional ?city=
router.get('/', async (req, res) => {
    try {
        await refresh();
        const result = await pool.query(
            `SELECT c.camp_id, c.camp_name, c.location_address, c.city, c.latitude, c.longitude,
                    c.start_time, c.end_time, c.max_capacity, c.status, u.name AS organizer_name,
                    c.max_capacity - (SELECT COUNT(*)::int FROM camp_appointments a WHERE a.camp_id = c.camp_id) AS slots_left
             FROM camps c JOIN users u ON u.user_id = c.organizer_id
             WHERE c.status IN ('Published', 'Ongoing')
               AND ($1::text IS NULL OR LOWER(c.city) = LOWER($1))
             ORDER BY c.start_time`,
            [req.query.city || null]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('List Camps Error:', err.message);
        res.status(500).json({ error: 'Server error listing camps.' });
    }
});

// GET /api/camps/mine : organizer's camps with live counts
router.get('/mine', authorizeRoles('camp_organizer'), async (req, res) => {
    try {
        await refresh();
        const result = await pool.query(
            `${STATS_SQL} WHERE c.organizer_id = $1 GROUP BY c.camp_id ORDER BY c.start_time DESC`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('My Camps Error:', err.message);
        res.status(500).json({ error: 'Server error listing your camps.' });
    }
});

// POST /api/camps : create (starts as Draft)
router.post('/', authorizeRoles('camp_organizer'), async (req, res) => {
    try {
        const b = req.body;
        const max_capacity = parseInt(b.max_capacity, 10);
        const values = {
            camp_name: b.camp_name, location_address: b.location_address, city: b.city,
            start_time: b.start_time, end_time: b.end_time, max_capacity,
            target_units: b.target_units === undefined ? max_capacity : parseInt(b.target_units, 10)
        };
        const error = validateCamp(values, true);
        if (error) return res.status(400).json({ error });

        const result = await pool.query(
            `INSERT INTO camps (organizer_id, camp_name, location_address, city, start_time, end_time,
                                target_units, max_capacity, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [req.user.user_id, values.camp_name, values.location_address, values.city, values.start_time,
             values.end_time, values.target_units, values.max_capacity, b.latitude ?? null, b.longitude ?? null]
        );
        res.status(201).json({ message: 'Camp created as Draft.', camp: result.rows[0] });
    } catch (err) {
        console.error('Create Camp Error:', err.message);
        res.status(500).json({ error: 'Server error creating camp.' });
    }
});

// PUT /api/camps/:id : edit a Draft or Published camp
router.put('/:id', authorizeRoles('camp_organizer'), async (req, res) => {
    try {
        const cur = await pool.query('SELECT * FROM camps WHERE camp_id = $1 AND organizer_id = $2',
            [req.params.id, req.user.user_id]);
        if (cur.rows.length === 0) return res.status(404).json({ error: 'Camp not found.' });
        const camp = cur.rows[0];
        if (!['Draft', 'Published'].includes(camp.status)) {
            return res.status(409).json({ error: 'Only Draft or Published camps can be edited.' });
        }
        const b = req.body;
        const values = {
            camp_name: b.camp_name ?? camp.camp_name,
            location_address: b.location_address ?? camp.location_address,
            city: b.city ?? camp.city,
            start_time: b.start_time ?? camp.start_time,
            end_time: b.end_time ?? camp.end_time,
            max_capacity: b.max_capacity !== undefined ? parseInt(b.max_capacity, 10) : camp.max_capacity,
            target_units: b.target_units !== undefined ? parseInt(b.target_units, 10) : camp.target_units
        };
        const error = validateCamp(values, b.start_time !== undefined);
        if (error) return res.status(400).json({ error });

        const booked = await pool.query('SELECT COUNT(*)::int AS n FROM camp_appointments WHERE camp_id = $1', [camp.camp_id]);
        if (values.max_capacity < booked.rows[0].n) {
            return res.status(409).json({ error: `Capacity cannot be lower than the ${booked.rows[0].n} donors already booked.` });
        }

        const result = await pool.query(
            `UPDATE camps SET camp_name = $2, location_address = $3, city = $4, start_time = $5, end_time = $6,
                    max_capacity = $7, target_units = $8,
                    latitude = COALESCE($9, latitude), longitude = COALESCE($10, longitude)
             WHERE camp_id = $1 RETURNING *`,
            [camp.camp_id, values.camp_name, values.location_address, values.city, values.start_time,
             values.end_time, values.max_capacity, values.target_units, b.latitude ?? null, b.longitude ?? null]
        );
        res.json({ message: 'Camp updated.', camp: result.rows[0] });
    } catch (err) {
        console.error('Update Camp Error:', err.message);
        res.status(500).json({ error: 'Server error updating camp.' });
    }
});

// PUT /api/camps/:id/publish : Draft -> Published
router.put('/:id/publish', authorizeRoles('camp_organizer'), async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE camps SET status = 'Published'
             WHERE camp_id = $1 AND organizer_id = $2 AND status = 'Draft' AND start_time > NOW()
             RETURNING camp_id, status`,
            [req.params.id, req.user.user_id]
        );
        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Camp not found, not a Draft, or its start time has passed.' });
        }
        res.json({ message: 'Camp published.', camp: result.rows[0] });
    } catch (err) {
        console.error('Publish Error:', err.message);
        res.status(500).json({ error: 'Server error publishing camp.' });
    }
});

// PUT /api/camps/:id/cancel : Draft or Published -> Cancelled
router.put('/:id/cancel', authorizeRoles('camp_organizer'), async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE camps SET status = 'Cancelled'
             WHERE camp_id = $1 AND organizer_id = $2 AND status IN ('Draft', 'Published')
             RETURNING camp_id, status`,
            [req.params.id, req.user.user_id]
        );
        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Camp not found or can no longer be cancelled.' });
        }
        res.json({ message: 'Camp cancelled.', camp: result.rows[0] });
    } catch (err) {
        console.error('Cancel Camp Error:', err.message);
        res.status(500).json({ error: 'Server error cancelling camp.' });
    }
});

// GET /api/camps/:id/dashboard : registrations, check-ins, units collected
router.get('/:id/dashboard', authorizeRoles('camp_organizer'), async (req, res) => {
    try {
        await refresh();
        const result = await pool.query(
            `${STATS_SQL} WHERE c.camp_id = $1 AND c.organizer_id = $2 GROUP BY c.camp_id`,
            [req.params.id, req.user.user_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Camp not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Dashboard Error:', err.message);
        res.status(500).json({ error: 'Server error loading dashboard.' });
    }
});

module.exports = router;
