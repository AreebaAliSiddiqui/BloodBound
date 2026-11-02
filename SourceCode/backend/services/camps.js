const pool = require('../config/db');

// Published -> Ongoing when the camp starts; -> Completed when it ends.
async function refreshCampStatuses() {
    await pool.query(
        `UPDATE camps SET status = 'Ongoing'
         WHERE status = 'Published' AND start_time <= NOW() AND end_time > NOW()`
    );
    await pool.query(
        `UPDATE camps SET status = 'Completed'
         WHERE status IN ('Published', 'Ongoing') AND end_time <= NOW()`
    );
}

module.exports = { refreshCampStatuses };
