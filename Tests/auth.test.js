// SCRUM-27: registration, login and role-based access
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { api, uid, uniqueCity, register } = require('./helpers');

describe('SCRUM-27 auth', () => {
    const base = (role, extra = {}) => ({
        name: 'Auth Test', email: `auth.${uid()}@test.local`, password: 'password123',
        role, phone: '03001112222', ...extra
    });

    it('registers a donor and does not leak the password hash', async () => {
        const r = await api('POST', '/auth/register', { body: base('donor', { blood_group: 'O+', city: uniqueCity() }) });
        assert.equal(r.status, 201);
        assert.equal(r.data.user.role, 'donor');
        assert.equal(r.data.user.password_hash, undefined);
    });

    it('registers a hospital_staff and a camp_organizer', async () => {
        assert.equal((await api('POST', '/auth/register', { body: base('hospital_staff') })).status, 201);
        assert.equal((await api('POST', '/auth/register', { body: base('camp_organizer') })).status, 201);
    });

    it('rejects self-registration as admin', async () => {
        const r = await api('POST', '/auth/register', { body: base('admin') });
        assert.equal(r.status, 400);
    });

    it('rejects a duplicate email', async () => {
        const body = base('hospital_staff');
        assert.equal((await api('POST', '/auth/register', { body })).status, 201);
        assert.equal((await api('POST', '/auth/register', { body })).status, 400);
    });

    it('rejects missing fields, short passwords and bad donor data', async () => {
        assert.equal((await api('POST', '/auth/register', { body: { email: 'x@test.local' } })).status, 400);
        assert.equal((await api('POST', '/auth/register', { body: base('hospital_staff', { password: 'short' }) })).status, 400);
        assert.equal((await api('POST', '/auth/register', { body: base('donor', { city: 'X' }) })).status, 400);           // no blood group
        assert.equal((await api('POST', '/auth/register', { body: base('donor', { blood_group: 'Z+', city: 'X' }) })).status, 400);
    });

    it('logs in and returns a token and the role', async () => {
        const u = await register('hospital_staff');
        const l = await api('POST', '/auth/login', { body: { email: u.email, password: 'password123' } });
        assert.equal(l.status, 200);
        assert.ok(l.data.token);
        assert.equal(l.data.role, 'hospital_staff');
    });

    it('rejects a wrong password and an unknown email', async () => {
        const u = await register('hospital_staff');
        assert.equal((await api('POST', '/auth/login', { body: { email: u.email, password: 'wrongpass' } })).status, 400);
        assert.equal((await api('POST', '/auth/login', { body: { email: 'nobody@test.local', password: 'password123' } })).status, 400);
    });

    it('protects routes: no token = 401, bad token = 403, wrong role = 403', async () => {
        assert.equal((await api('GET', '/donors/me')).status, 401);
        assert.equal((await api('GET', '/donors/me', { token: 'not-a-real-token' })).status, 403);
        const donor = await register('donor', { blood_group: 'O+', city: uniqueCity() });
        assert.equal((await api('GET', '/requests', { token: donor.token })).status, 403);   // hospital-only
        assert.equal((await api('POST', '/camps', { token: donor.token, body: {} })).status, 403); // organizer-only
    });
});
