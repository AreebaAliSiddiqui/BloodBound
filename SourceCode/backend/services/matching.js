const pool = require('../config/db');

// Moves open requests past their expiry time to 'Expired'.
async function expireOverdueRequests() {
    const result = await pool.query(
        `UPDATE hospital_requests
         SET status = 'Expired'
         WHERE status IN ('Pending', 'Matching') AND expires_at < NOW()`
    );
    return result.rowCount;
}

module.exports = { expireOverdueRequests };
