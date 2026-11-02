// Removes the data created by the automated tests (users with @test.local emails and what belongs to them).
// Usage: node Tests/cleanup.js
const { db } = require('./helpers');

(async () => {
    await db(`DELETE FROM blood_inventory WHERE source_camp_id IN (
                SELECT camp_id FROM camps WHERE organizer_id IN (SELECT user_id FROM users WHERE email LIKE '%@test.local'))`);
    const r = await db(`DELETE FROM users WHERE email LIKE '%@test.local'`);
    console.log(`Removed ${r.rowCount} test users and their data.`);
})().catch((e) => { console.error('Cleanup failed:', e.message); process.exit(1); });
