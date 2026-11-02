const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { computeEligibility } = require('../utils/eligibility');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(verifyToken, authorizeRoles('donor'));

// POST /api/bookings : book a slot at a camp. Body: { camp_id, slot_time? } (slot_time defaults to camp start)
router.post('/', async (req, res) => {
    const { camp_id, slot_time } = req.body;
    if (!camp_id || !UUID_RE.test(camp_id)) return res.status(400).json({ error: 'A valid camp_id is required.' });

    const client = await pool.connect();
    const fail = async (code, error, extra = {}) => {
        await client.query('ROLLBACK').catch(() => {});
        return res.status(code).json({ error, ...extra });
    };
    try {
        await client.query('BEGIN');
        // Lock the camp row so two donors cannot take the last place at the same time.
        const c = await client.query('SELECT * FROM camps WHERE camp_id = $1 FOR UPDATE', [camp_id]);
        if (c.rows.length === 0) return fail(404, 'Camp not found.');
        const camp = c.rows[0];
        if (!['Published', 'Ongoing'].includes(camp.status)) return fail(409, 'This camp is not open for booking.');

        const slot = slot_time ? new Date(slot_time) : new Date(camp.start_time);
        const earliest = new Date(Math.max(Date.now(), new Date(camp.start_time).getTime()));
        if (isNaN(slot) || slot < earliest || slot >= new Date(camp.end_time)) {
            return fail(400, 'slot_time must be inside the camp hours and not in the past.');
        }

        const d = await client.query('SELECT donor_id, last_donation_date FROM donor_profiles WHERE user_id = $1', [req.user.user_id]);
        if (d.rows.length === 0) return fail(404, 'Donor profile not found.');
        const donor = d.rows[0];
        const elig = computeEligibility(donor.last_donation_date, slot);
        if (!elig.eligible) {
            return fail(403, 'You will not be eligible to donate on that date.', { next_eligible_date: elig.next_eligible_date });
        }

        const count = await client.query('SELECT COUNT(*)::int AS n FROM camp_appointments WHERE camp_id = $1', [camp_id]);
        if (count.rows[0].n >= camp.max_capacity) return fail(409, 'This camp is fully booked.');

        const inserted = await client.query(
            `INSERT INTO camp_appointments (camp_id, donor_id, slot_time) VALUES ($1, $2, $3)
             RETURNING appointment_id, camp_id, slot_time`,
            [camp_id, donor.donor_id, slot]
        );
        await client.query('COMMIT');
        res.status(201).json({
            message: 'Slot booked.',
            booking: inserted.rows[0],
            slots_left: camp.max_capacity - count.rows[0].n - 1
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        if (err.code === '23505') return res.status(409).json({ error: 'You have already booked this camp.' });
        console.error('Booking Error:', err.message);
        res.status(500).json({ error: 'Server error booking slot.' });
    } finally {
        client.release();
    }
});

// GET /api/bookings/mine
router.get('/mine', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.appointment_id, a.slot_time, a.attended, c.camp_id, c.camp_name,
                    c.location_address, c.city, c.status AS camp_status
             FROM camp_appointments a
             JOIN donor_profiles d ON d.donor_id = a.donor_id
             JOIN camps c ON c.camp_id = a.camp_id
             WHERE d.user_id = $1
             ORDER BY a.slot_time`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('My Bookings Error:', err.message);
        res.status(500).json({ error: 'Server error fetching bookings.' });
    }
});

// DELETE /api/bookings/:camp_id : cancel my booking (frees the slot)
router.delete('/:camp_id', async (req, res) => {
    if (!UUID_RE.test(req.params.camp_id)) return res.status(400).json({ error: 'Invalid camp id.' });
    try {
        const result = await pool.query(
            `DELETE FROM camp_appointments
             WHERE camp_id = $1 AND attended = FALSE AND slot_time > NOW()
               AND donor_id = (SELECT donor_id FROM donor_profiles WHERE user_id = $2)
             RETURNING appointment_id`,
            [req.params.camp_id, req.user.user_id]
        );
        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'No cancellable booking found for this camp.' });
        }
        res.json({ message: 'Booking cancelled.' });
    } catch (err) {
        console.error('Cancel Booking Error:', err.message);
        res.status(500).json({ error: 'Server error cancelling booking.' });
    }
});

module.exports = router;
