// Shared helpers for the Bloodbound integration tests.
// The API server must be running (cd SourceCode/backend && npx nodemon server.js).
const path = require('path');
const assert = require('node:assert/strict');

const backend = path.join(__dirname, '..', 'SourceCode', 'backend');
require(path.join(backend, 'node_modules', 'dotenv')).config({ path: path.join(backend, '.env') });
const { Client } = require(path.join(backend, 'node_modules', 'pg'));
const bcrypt = require(path.join(backend, 'node_modules', 'bcryptjs'));
const jwt = require(path.join(backend, 'node_modules', 'jsonwebtoken'));

const JWT_SECRET = process.env.JWT_SECRET || 'bloodbound_super_secret_key_2026';

const BASE = process.env.API_URL || 'http://localhost:5000/api';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const uniqueCity = () => 'City' + uid();
// UTC date string, offset in days from today (negative = past)
const dayStr = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);
const addDays = (dateStr, n) => new Date(Date.parse(dateStr) + n * 864e5).toISOString().slice(0, 10);

async function api(method, route, { token, body } = {}) {
    const res = await fetch(BASE + route, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch { /* no body */ }
    return { status: res.status, data };
}

// Registers a user (unique @test.local email) and logs in.
async function register(role, extra = {}) {
    const email = `${role}.${uid()}@test.local`;
    const body = { name: `Test ${role}`, email, password: 'password123', role, phone: '03000000000', ...extra };
    const r = await api('POST', '/auth/register', { body });
    assert.equal(r.status, 201, `register ${role} failed: ${JSON.stringify(r.data)}`);
    const l = await api('POST', '/auth/login', { body: { email, password: 'password123' } });
    assert.equal(l.status, 200, `login ${role} failed: ${JSON.stringify(l.data)}`);
    return { email, token: l.data.token, user: r.data.user, phone: body.phone };
}
const registerDonor = (city, blood_group, extra = {}) => register('donor', { city, blood_group, ...extra });

async function db(sql, params = []) {
    const c = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
    await c.connect();
    try { return await c.query(sql, params); } finally { await c.end(); }
}

const requestBody = (city, o = {}) => ({
    patient_identifier: 'P-' + uid(), blood_group: 'A+', component: 'Whole Blood', units_required: 1,
    urgency: 'Critical', city, hospital_name: 'Test Hospital', hospital_address: 'Main Road', ...o
});
async function createRequest(hospitalToken, city, o = {}) {
    const r = await api('POST', '/requests', { token: hospitalToken, body: requestBody(city, o) });
    assert.equal(r.status, 201, `create request failed: ${JSON.stringify(r.data)}`);
    return r.data;
}

const campBody = (city, o = {}) => {
    const d = dayStr(1);
    return { camp_name: 'Test Blood Drive', location_address: 'Main Road', city,
             start_time: `${d}T09:00:00Z`, end_time: `${d}T17:00:00Z`, max_capacity: 10, ...o };
};
async function createCamp(orgToken, city, o = {}) {
    const r = await api('POST', '/camps', { token: orgToken, body: campBody(city, o) });
    assert.equal(r.status, 201, `create camp failed: ${JSON.stringify(r.data)}`);
    return r.data.camp;
}
async function createPublishedCamp(orgToken, city, o = {}) {
    const camp = await createCamp(orgToken, city, o);
    const p = await api('PUT', `/camps/${camp.camp_id}/publish`, { token: orgToken });
    assert.equal(p.status, 200, `publish failed: ${JSON.stringify(p.data)}`);
    return camp;
}

async function registerAdmin(extra = {}) {
    const email = `admin.${uid()}@test.local`;
    const password = extra.password || 'password123';
    const hash = await bcrypt.hash(password, 10);
    const r = await db(
        `INSERT INTO users (name, email, password_hash, role, phone, is_active)
         VALUES ($1, $2, $3, 'admin', '03000000000', TRUE)
         RETURNING user_id, name, email, role, phone, is_active`,
        [extra.name || `Admin ${uid()}`, email, hash]
    );
    const user = r.rows[0];
    const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role: 'admin', is_active: true },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    return { email, token, user, phone: user.phone, password };
}

module.exports = { BASE, uid, uniqueCity, dayStr, addDays, api, register, registerDonor, registerAdmin, db,
                   requestBody, createRequest, campBody, createCamp, createPublishedCamp };
