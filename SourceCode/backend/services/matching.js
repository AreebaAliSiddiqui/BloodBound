const pool = require('../config/db');
const { donorGroupsFor } = require('../utils/compatibility');
const { GAP_DAYS } = require('../utils/eligibility');

// Finds compatible, eligible donors in the request's city and records an alert
// for each one in matching_logs. Returns how many donors were alerted.
async function matchDonors(client, request) {
    const groups = donorGroupsFor(request.blood_group, request.component);
    const result = await client.query(
        `INSERT INTO matching_logs (request_id, donor_id)
         SELECT $1, d.donor_id
         FROM donor_profiles d
         WHERE d.blood_group = ANY($2::blood_group[])
           AND LOWER(d.city) = LOWER($3)
           AND (d.last_donation_date IS NULL OR d.last_donation_date <= CURRENT_DATE - $4::int)
         ON CONFLICT (request_id, donor_id) DO NOTHING
         RETURNING donor_id`,
        [request.request_id, groups, request.city, GAP_DAYS]
    );
    return result.rowCount;
}

// Moves open requests past their expiry time to 'Expired'.
async function expireOverdueRequests() {
    const result = await pool.query(
        `UPDATE hospital_requests
         SET status = 'Expired'
         WHERE status IN ('Pending', 'Matching') AND expires_at < NOW()`
    );
    return result.rowCount;
}

module.exports = { matchDonors, expireOverdueRequests };
