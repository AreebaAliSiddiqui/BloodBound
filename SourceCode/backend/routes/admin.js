const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { expireOverdueRequests } = require('../services/matching');
const { refreshCampStatuses } = require('../services/camps');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(verifyToken, authorizeRoles('admin'));

router.param('id', (req, res, next, id) => {
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid id format.' });
    next();
});

// ---------- DASHBOARD (SCRUM-37) ----------

// GET /api/admin/dashboard : aggregated system overview
router.get('/dashboard', async (req, res) => {
    try {
        await expireOverdueRequests().catch(() => {});
        await refreshCampStatuses().catch(() => {});

        // 1. User stats
        const usersCountRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active,
                COUNT(*) FILTER (WHERE is_active = FALSE)::int AS deactivated,
                COUNT(*) FILTER (WHERE role = 'donor')::int AS donors,
                COUNT(*) FILTER (WHERE role = 'hospital_staff')::int AS hospital_staff,
                COUNT(*) FILTER (WHERE role = 'camp_organizer')::int AS camp_organizers,
                COUNT(*) FILTER (WHERE role = 'admin')::int AS admins
            FROM users
        `);

        // 2. Request stats
        const requestsCountRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending,
                COUNT(*) FILTER (WHERE status = 'Matching')::int AS matching,
                COUNT(*) FILTER (WHERE status = 'Fulfilled')::int AS fulfilled,
                COUNT(*) FILTER (WHERE status = 'Expired')::int AS expired,
                COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled,
                COUNT(*) FILTER (WHERE is_moderated = TRUE)::int AS moderated,
                COUNT(*) FILTER (WHERE urgency = 'Level 1 - Stat')::int AS critical,
                COUNT(*) FILTER (WHERE urgency = 'Level 2 - Urgent')::int AS urgent,
                COUNT(*) FILTER (WHERE urgency = 'Routine')::int AS routine
            FROM hospital_requests
        `);

        // 3. Camp stats
        const campsCountRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'Draft')::int AS draft,
                COUNT(*) FILTER (WHERE status = 'Published')::int AS published,
                COUNT(*) FILTER (WHERE status = 'Ongoing')::int AS ongoing,
                COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled
            FROM camps
        `);

        // 4. Recent activity snapshots
        const recentRequests = await pool.query(`
            SELECT r.request_id, r.blood_group, r.urgency, r.status, r.city, r.hospital_name, r.created_at, r.is_moderated
            FROM hospital_requests r ORDER BY r.created_at DESC LIMIT 5
        `);

        const recentUsers = await pool.query(`
            SELECT user_id, name, email, role, is_active, created_at
            FROM users ORDER BY created_at DESC LIMIT 5
        `);

        const recentCamps = await pool.query(`
            SELECT camp_id, camp_name, city, status, start_time, created_at
            FROM camps ORDER BY created_at DESC LIMIT 5
        `);

        res.json({
            users: usersCountRes.rows[0],
            requests: requestsCountRes.rows[0],
            camps: campsCountRes.rows[0],
            recent_activity: {
                requests: recentRequests.rows,
                users: recentUsers.rows,
                camps: recentCamps.rows
            }
        });
    } catch (err) {
        console.error('Admin Dashboard Error:', err.message);
        res.status(500).json({ error: 'Server error loading admin dashboard.' });
    }
});

// ---------- USER MANAGEMENT (SCRUM-37) ----------

// GET /api/admin/users : list registered users with optional filters
router.get('/users', async (req, res) => {
    try {
        const { role, is_active, search } = req.query;
        const conditions = [];
        const params = [];

        if (role) {
            params.push(role);
            conditions.push(`u.role = $${params.length}`);
        }
        if (is_active !== undefined) {
            params.push(is_active === 'true');
            conditions.push(`u.is_active = $${params.length}`);
        }
        if (search) {
            params.push(`%${search.trim()}%`);
            conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR d.city ILIKE $${params.length})`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `
            SELECT u.user_id, u.name, u.email, u.phone, u.role, u.is_active,
                   u.deactivated_at, u.deactivation_reason, u.created_at,
                   d.blood_group, d.city, d.is_eligible, d.last_donation_date
            FROM users u
            LEFT JOIN donor_profiles d ON d.user_id = u.user_id
            ${whereClause}
            ORDER BY u.created_at DESC
        `;
        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Admin List Users Error:', err.message);
        res.status(500).json({ error: 'Server error listing users.' });
    }
});

// GET /api/admin/users/:id : single user details
router.get('/users/:id', async (req, res) => {
    try {
        const userRes = await pool.query(
            `SELECT u.user_id, u.name, u.email, u.phone, u.role, u.is_active,
                    u.deactivated_at, u.deactivation_reason, u.created_at,
                    d.blood_group, d.city, d.is_eligible, d.last_donation_date
             FROM users u
             LEFT JOIN donor_profiles d ON d.user_id = u.user_id
             WHERE u.user_id = $1`,
            [req.params.id]
        );
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

        const user = userRes.rows[0];
        let stats = {};

        if (user.role === 'hospital_staff') {
            const reqStats = await pool.query(
                `SELECT COUNT(*)::int AS total_requests,
                        COUNT(*) FILTER (WHERE status = 'Fulfilled')::int AS fulfilled_requests
                 FROM hospital_requests WHERE hospital_id = $1`, [user.user_id]);
            stats = reqStats.rows[0];
        } else if (user.role === 'camp_organizer') {
            const campStats = await pool.query(
                `SELECT COUNT(*)::int AS total_camps FROM camps WHERE organizer_id = $1`, [user.user_id]);
            stats = campStats.rows[0];
        } else if (user.role === 'donor') {
            const apptStats = await pool.query(
                `SELECT COUNT(*)::int AS total_bookings,
                        COUNT(*) FILTER (WHERE attended = TRUE)::int AS total_donations
                 FROM camp_appointments a
                 JOIN donor_profiles d ON d.donor_id = a.donor_id
                 WHERE d.user_id = $1`, [user.user_id]);
            stats = apptStats.rows[0];
        }

        res.json({ user, stats });
    } catch (err) {
        console.error('Admin Get User Error:', err.message);
        res.status(500).json({ error: 'Server error retrieving user.' });
    }
});

// PUT /api/admin/users/:id/deactivate : deactivate a user
router.put('/users/:id/deactivate', async (req, res) => {
    try {
        if (req.params.id === req.user.user_id) {
            return res.status(400).json({ error: 'Admins cannot deactivate their own account.' });
        }

        const reason = req.body.reason || 'Deactivated by admin for safety/moderation.';
        const result = await pool.query(
            `UPDATE users
             SET is_active = FALSE,
                 deactivated_at = CURRENT_TIMESTAMP,
                 deactivation_reason = $2
             WHERE user_id = $1
             RETURNING user_id, name, email, role, is_active, deactivated_at, deactivation_reason`,
            [req.params.id, reason]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({
            message: 'User deactivated successfully.',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Admin Deactivate User Error:', err.message);
        res.status(500).json({ error: 'Server error deactivating user.' });
    }
});

// PUT /api/admin/users/:id/reactivate : reactivate a user
router.put('/users/:id/reactivate', async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE users
             SET is_active = TRUE,
                 deactivated_at = NULL,
                 deactivation_reason = NULL
             WHERE user_id = $1
             RETURNING user_id, name, email, role, is_active`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({
            message: 'User reactivated successfully.',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Admin Reactivate User Error:', err.message);
        res.status(500).json({ error: 'Server error reactivating user.' });
    }
});

// ---------- REQUEST MODERATION (SCRUM-37) ----------

// GET /api/admin/requests : list all requests across hospitals with moderation flags
router.get('/requests', async (req, res) => {
    try {
        await expireOverdueRequests().catch(() => {});
        const { status, urgency, is_moderated, search } = req.query;
        const conditions = [];
        const params = [];

        if (status) {
            params.push(status);
            conditions.push(`r.status = $${params.length}`);
        }
        if (urgency) {
            params.push(urgency);
            conditions.push(`r.urgency = $${params.length}`);
        }
        if (is_moderated !== undefined) {
            params.push(is_moderated === 'true');
            conditions.push(`r.is_moderated = $${params.length}`);
        }
        if (search) {
            params.push(`%${search.trim()}%`);
            conditions.push(`(r.patient_identifier ILIKE $${params.length} OR r.hospital_name ILIKE $${params.length} OR r.city ILIKE $${params.length})`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `
            SELECT r.*,
                   hu.name AS hospital_user_name, hu.email AS hospital_email, hu.phone AS hospital_contact,
                   admin_u.name AS moderated_by_name,
                   (SELECT COUNT(*)::int FROM matching_logs m WHERE m.request_id = r.request_id) AS donors_alerted,
                   (SELECT COUNT(*)::int FROM matching_logs m WHERE m.request_id = r.request_id AND m.response_status = 'Accepted') AS donors_accepted
            FROM hospital_requests r
            JOIN users hu ON hu.user_id = r.hospital_id
            LEFT JOIN users admin_u ON admin_u.user_id = r.moderated_by
            ${whereClause}
            ORDER BY r.created_at DESC
        `;
        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Admin List Requests Error:', err.message);
        res.status(500).json({ error: 'Server error listing requests.' });
    }
});

// PUT /api/admin/requests/:id/expire : force-expire a suspicious request (D1 risk mitigation)
router.put('/requests/:id/expire', async (req, res) => {
    try {
        const reason = req.body.reason || 'Expired by admin moderation: flagged as suspicious or unverified request.';
        const result = await pool.query(
            `UPDATE hospital_requests
             SET status = 'Expired',
                 expires_at = CURRENT_TIMESTAMP,
                 is_moderated = TRUE,
                 moderated_by = $2,
                 moderated_at = CURRENT_TIMESTAMP,
                 moderation_reason = $3
             WHERE request_id = $1
             RETURNING *`,
            [req.params.id, req.user.user_id, reason]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        res.json({
            message: 'Suspicious request expired by administrator.',
            request: result.rows[0]
        });
    } catch (err) {
        console.error('Admin Expire Request Error:', err.message);
        res.status(500).json({ error: 'Server error expiring request.' });
    }
});

// PUT /api/admin/requests/:id/remove : cancel/remove a fake or abusive request
router.put('/requests/:id/remove', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const reason = req.body.reason || 'Removed by admin moderation: confirmed fake, abusive, or malicious request.';
        const result = await client.query(
            `UPDATE hospital_requests
             SET status = 'Cancelled',
                 is_moderated = TRUE,
                 moderated_by = $2,
                 moderated_at = CURRENT_TIMESTAMP,
                 moderation_reason = $3
             WHERE request_id = $1
             RETURNING *`,
            [req.params.id, req.user.user_id, reason]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found.' });
        }

        // Cancel any pending matching logs for this removed request
        await client.query(
            `UPDATE matching_logs SET response_status = 'Cancelled'
             WHERE request_id = $1 AND response_status IN ('Pending', 'Matching')`,
            [req.params.id]
        );

        await client.query('COMMIT');
        res.json({
            message: 'Fake or abusive request removed by administrator.',
            request: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Admin Remove Request Error:', err.message);
        res.status(500).json({ error: 'Server error removing request.' });
    } finally {
        client.release();
    }
});

// DELETE /api/admin/requests/:id : alias for removal
router.delete('/requests/:id', async (req, res) => {
    // Forward to remove logic
    req.url = `/${req.params.id}/remove`;
    router.handle(req, res);
});

// ---------- CAMPS MONITORING (SCRUM-37) ----------

// GET /api/admin/camps : list all camps for administrative monitoring
router.get('/camps', async (req, res) => {
    try {
        await refreshCampStatuses().catch(() => {});
        const result = await pool.query(`
            SELECT c.*,
                   u.name AS organizer_name, u.email AS organizer_email, u.phone AS organizer_phone,
                   (SELECT COUNT(*)::int FROM camp_appointments a WHERE a.camp_id = c.camp_id) AS booked_slots,
                   (SELECT COUNT(*)::int FROM camp_appointments a WHERE a.camp_id = c.camp_id AND a.attended = TRUE) AS attended_donors
            FROM camps c
            JOIN users u ON u.user_id = c.organizer_id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Admin List Camps Error:', err.message);
        res.status(500).json({ error: 'Server error listing camps.' });
    }
});

module.exports = router;
