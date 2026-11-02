// Creates demo accounts with real bcrypt hashes. Run from SourceCode/backend:  node scripts/seed-demo-users.js
require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('../config/db')

const PASSWORD = 'Demo@1234'
const users = [
  ['Demo Admin', 'admin.demo@bloodbound.org', 'admin', '+923000000011'],
  ['Demo Hospital', 'hospital.demo@bloodbound.org', 'hospital_staff', '+923000000012'],
  ['Demo Organizer', 'organizer.demo@bloodbound.org', 'camp_organizer', '+923000000013'],
  ['Demo Donor', 'donor.demo@bloodbound.org', 'donor', '+923000000014'],
]

;(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10)
  for (const [name, email, role, phone] of users) {
    const r = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO NOTHING RETURNING user_id`, [name, email, hash, role, phone])
    if (role === 'donor' && r.rows[0]) {
      await pool.query(`INSERT INTO donor_profiles (user_id, blood_group, city) VALUES ($1,'O-','Karachi')`, [r.rows[0].user_id])
    }
  }
  console.log(`Demo users ready. Password for all: ${PASSWORD}`)
  await pool.end()
})().catch((e) => { console.error(e.message); process.exit(1) })
