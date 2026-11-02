// Deletes ALL users and everything linked to them (donors, requests, matches, camps, bookings, inventory).
// The tables themselves (schema) are kept. Run from SourceCode/backend:  node scripts/reset-database.js --yes
require('dotenv').config()
const pool = require('../config/db')

if (!process.argv.includes('--yes')) {
  console.log('This deletes ALL data in the database named in your .env file.')
  console.log('If you are sure, run:  node scripts/reset-database.js --yes')
  process.exit(0)
}
;(async () => {
  const before = await pool.query('SELECT COUNT(*)::int AS n FROM users')
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE')
  console.log(`Deleted ${before.rows[0].n} users and all linked data. Schema untouched.`)
  await pool.end()
})().catch((e) => { console.error('Reset failed:', e.message); process.exit(1) })
