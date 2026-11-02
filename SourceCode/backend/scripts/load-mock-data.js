// Loads InputData/mock-data.json. Users go in directly (with real bcrypt hashes); requests, camps, bookings and
// acceptances are created through the real API, so matching, eligibility and capacity rules all run.
// The backend must be running. From SourceCode/backend:  node scripts/load-mock-data.js
require('dotenv').config()
const fs = require('fs')
const path = require('path')
let bcrypt
try { bcrypt = require('bcryptjs') } catch { bcrypt = require('bcrypt') }
const pool = require('../config/db')

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'InputData', 'mock-data.json'), 'utf8'))
const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`
const tokens = {}, camps = {}, requests = {}

async function call(method, p, who, body) {
  const res = await fetch(API + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(who ? { Authorization: `Bearer ${tokens[who]}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`)
  return j
}
async function step(label, fn) {
  try { await fn(); console.log('  ok  ', label) } catch (e) { console.log('  SKIP', label, '-', e.message) }
}
function window(days, hour, hours) {
  const s = new Date(); s.setDate(s.getDate() + days); s.setHours(hour, 0, 0, 0)
  return [s.toISOString(), new Date(s.getTime() + hours * 3600000).toISOString()]
}

;(async () => {
  const emails = data.users.map((u) => u.email)
  const existing = await pool.query('SELECT COUNT(*)::int AS n FROM users WHERE email = ANY($1)', [emails])
  if (existing.rows[0].n > 0) {
    console.log('Mock users already exist. Run  node scripts/reset-database.js --yes  first, then load again.')
    return pool.end()
  }

  console.log('Creating users...')
  const hash = await bcrypt.hash(data.password, 10)
  for (const u of data.users) {
    const r = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1,$2,$3,$4,$5) RETURNING user_id',
      [u.name, u.email, hash, u.role, u.phone])
    if (u.role === 'donor') {
      await pool.query(
        'INSERT INTO donor_profiles (user_id, blood_group, city, last_donation_date) VALUES ($1,$2,$3,$4)',
        [r.rows[0].user_id, u.blood_group, u.city, u.last_donation_date])
    }
  }
  await pool.end()

  console.log('Logging in...')
  for (const u of data.users) {
    const r = await call('POST', '/auth/login', null, { email: u.email, password: data.password })
    tokens[u.email] = r.token
  }

  console.log('Creating blood requests...')
  for (const q of data.requests) {
    await step(`${q.patient_identifier} ${q.blood_group} at ${q.hospital_name}`, async () => {
      const { hospital, ...body } = q
      const r = await call('POST', '/requests', hospital, body)
      requests[q.patient_identifier] = r.request.request_id
    })
  }

  console.log('Creating camps...')
  for (const c of data.camps) {
    await step(c.camp_name, async () => {
      const [start_time, end_time] = window(c.startInDays, c.startHour, c.durationHours)
      const r = await call('POST', '/camps', c.organizer, {
        camp_name: c.camp_name, location_address: c.location_address, city: c.city,
        start_time, end_time, max_capacity: c.max_capacity, target_units: c.target_units })
      camps[c.camp_name] = r.camp.camp_id
      if (c.publish) await call('PUT', `/camps/${r.camp.camp_id}/publish`, c.organizer)
    })
  }

  console.log('Booking camp slots...')
  for (const b of data.bookings) {
    await step(`${b.donor} -> ${b.camp_name}`, () => call('POST', '/bookings', b.donor, { camp_id: camps[b.camp_name] }))
  }

  console.log('Accepting requests...')
  for (const a of data.accepts) {
    await step(`${a.donor} -> ${a.patient_identifier}`, () => call('POST', `/requests/${requests[a.patient_identifier]}/accept`, a.donor))
  }

  console.log(`\nDone. Every account uses the password: ${data.password}\n`)
  for (const u of data.users) console.log(`  ${u.role.padEnd(15)} ${u.email}`)
})().catch((e) => { console.error('Load failed:', e.message); process.exit(1) })
