// Public, read-only endpoints for the landing page. No login required.
// They expose only non-sensitive fields: no patient identifier, hospital address, phone numbers, coordinates or user ids.
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { refreshCampStatuses } = require('../services/camps');
const { expireOverdueRequests } = require('../services/matching');

// GET /api/public/camps : open camps (Published/Ongoing), soonest first
router.get('/camps', async (req, res) => {
    try {
        await refreshCampStatuses().catch((e) => console.error('Camp status error:', e.message));
        const result = await pool.query(
            `SELECT c.camp_id, c.camp_name, c.location_address, c.city, c.start_time, c.end_time, c.status,
                    c.max_capacity - (SELECT COUNT(*)::int FROM camp_appointments a WHERE a.camp_id = c.camp_id) AS slots_left
             FROM camps c
             WHERE c.status IN ('Published', 'Ongoing') AND c.end_time > NOW()
             ORDER BY c.start_time
             LIMIT 6`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Public Camps Error:', err.message);
        res.status(500).json({ error: 'Server error listing camps.' });
    }
});

// GET /api/public/live-request : the single most urgent open request, or { request: null }
router.get('/live-request', async (req, res) => {
    try {
        await expireOverdueRequests().catch((e) => console.error('Expiry error:', e.message));
        const result = await pool.query(
            `SELECT r.blood_group, r.component, r.units_required, r.urgency, r.city, r.hospital_name, r.expires_at,
                    (SELECT COUNT(*)::int FROM matching_logs m
                      WHERE m.request_id = r.request_id AND m.response_status = 'Accepted') AS donors_accepted
             FROM hospital_requests r
             WHERE r.status IN ('Pending', 'Matching') AND r.expires_at > NOW() AND r.is_moderated IS NOT TRUE
             ORDER BY CASE r.urgency WHEN 'Level 1 - Stat' THEN 0 WHEN 'Level 2 - Urgent' THEN 1 ELSE 2 END,
                      r.created_at DESC
             LIMIT 1`
        );
        res.json({ request: result.rows[0] || null });
    } catch (err) {
        console.error('Public Live Request Error:', err.message);
        res.status(500).json({ error: 'Server error fetching live request.' });
    }
});

module.exports = router;
