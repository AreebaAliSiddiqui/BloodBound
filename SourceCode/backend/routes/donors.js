const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { computeEligibility } = require('../utils/eligibility');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

router.use(verifyToken, authorizeRoles('donor'));

const withEligibility = (row) => ({ ...row, eligibility: computeEligibility(row.last_donation_date) });

// GET /api/donors/me : own profile + live eligibility
router.get('/me', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.name, u.email, u.phone, d.donor_id, d.blood_group, d.city,
                    d.latitude, d.longitude, d.last_donation_date
             FROM donor_profiles d JOIN users u ON u.user_id = d.user_id
             WHERE d.user_id = $1`,
            [req.user.user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Donor profile not found.' });
        }
        res.json(withEligibility(result.rows[0]));
    } catch (err) {
        console.error('Get Profile Error:', err.message);
        res.status(500).json({ error: 'Server error fetching profile.' });
    }
});

// PUT /api/donors/me : update own profile (partial updates allowed)
router.put('/me', async (req, res) => {
    try {
        const { blood_group, city, latitude, longitude, last_donation_date } = req.body;

        if (blood_group !== undefined && !BLOOD_GROUPS.includes(blood_group)) {
            return res.status(400).json({ error: 'Invalid blood_group.' });
        }
        if (last_donation_date !== undefined && last_donation_date !== null) {
            const d = new Date(last_donation_date);
            if (isNaN(d) || d > new Date()) {
                return res.status(400).json({ error: 'last_donation_date must be a valid past date.' });
            }
        }

        const result = await pool.query(
            `UPDATE donor_profiles SET
                blood_group = COALESCE($2, blood_group),
                city = COALESCE($3, city),
                latitude = COALESCE($4, latitude),
                longitude = COALESCE($5, longitude),
                last_donation_date = COALESCE($6, last_donation_date)
             WHERE user_id = $1
             RETURNING donor_id, blood_group, city, latitude, longitude, last_donation_date`,
            [req.user.user_id, blood_group ?? null, city ?? null,
             latitude ?? null, longitude ?? null, last_donation_date ?? null]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Donor profile not found.' });
        }

        const profile = withEligibility(result.rows[0]);
        // Keep the stored flag in sync so matching queries can filter on it later.
        await pool.query('UPDATE donor_profiles SET is_eligible = $2 WHERE user_id = $1',
            [req.user.user_id, profile.eligibility.eligible]);

        res.json({ message: 'Profile updated.', profile });
    } catch (err) {
        console.error('Update Profile Error:', err.message);
        res.status(500).json({ error: 'Server error updating profile.' });
    }
});

// GET /api/donors/me/eligibility : just the eligibility result
router.get('/me/eligibility', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT last_donation_date FROM donor_profiles WHERE user_id = $1',
            [req.user.user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Donor profile not found.' });
        }
        res.json(computeEligibility(result.rows[0].last_donation_date));
    } catch (err) {
        console.error('Eligibility Error:', err.message);
        res.status(500).json({ error: 'Server error checking eligibility.' });
    }
});

module.exports = router;
