// SCRUM-29: blood requests (create, list, view, cancel, expiry)
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, db, uniqueCity, register, registerDonor, requestBody, createRequest } = require('./helpers');

describe('SCRUM-29 blood requests', () => {
    let hospital, otherHospital, donor, city;
    before(async () => {
        city = uniqueCity();
        hospital = await register('hospital_staff');
        otherHospital = await register('hospital_staff');
        donor = await registerDonor(city, 'O+');
    });

    it('creates a Critical request as Pending, expiring in about 4 hours', async () => {
        const d = await createRequest(hospital.token, city, { urgency: 'Critical' });
        assert.equal(d.request.status, 'Pending');
        assert.equal(d.request.urgency, 'Level 1 - Stat');
        const hours = (new Date(d.request.expires_at) - new Date(d.request.created_at)) / 36e5;
        assert.ok(Math.abs(hours - 4) < 0.1, `expected ~4h, got ${hours}`);
    });

    it('maps High and Normal urgency to 12 and 24 hours', async () => {
        const high = await createRequest(hospital.token, city, { urgency: 'High' });
        const normal = await createRequest(hospital.token, city, { urgency: 'Normal' });
        const h = (r) => (new Date(r.expires_at) - new Date(r.created_at)) / 36e5;
        assert.ok(Math.abs(h(high.request) - 12) < 0.1);
        assert.ok(Math.abs(h(normal.request) - 24) < 0.1);
    });

    it('validates the input', async () => {
        const post = (o) => api('POST', '/requests', { token: hospital.token, body: requestBody(city, o) });
        assert.equal((await post({ blood_group: 'Z+' })).status, 400);
        assert.equal((await post({ units_required: 0 })).status, 400);
        assert.equal((await post({ units_required: 11 })).status, 400);
        assert.equal((await post({ component: 'Water' })).status, 400);
        assert.equal((await post({ urgency: 'Whenever' })).status, 400);
        assert.equal((await post({ city: '' })).status, 400);
    });

    it('only hospital staff can create requests', async () => {
        const r = await api('POST', '/requests', { token: donor.token, body: requestBody(city) });
        assert.equal(r.status, 403);
    });

    it('lists only my own requests with counts', async () => {
        const mine = await createRequest(hospital.token, city);
        const list = await api('GET', '/requests', { token: hospital.token });
        assert.equal(list.status, 200);
        assert.ok(list.data.some((r) => r.request_id === mine.request.request_id));
        const other = await api('GET', '/requests', { token: otherHospital.token });
        assert.ok(!other.data.some((r) => r.request_id === mine.request.request_id));
        assert.equal(typeof list.data[0].donors_alerted, 'number');
    });

    it('another hospital cannot view my request', async () => {
        const mine = await createRequest(hospital.token, city);
        assert.equal((await api('GET', `/requests/${mine.request.request_id}`, { token: hospital.token })).status, 200);
        assert.equal((await api('GET', `/requests/${mine.request.request_id}`, { token: otherHospital.token })).status, 404);
        assert.equal((await api('GET', '/requests/not-a-uuid', { token: hospital.token })).status, 400);
    });

    it('cancels a request once; a second cancel is rejected', async () => {
        const mine = await createRequest(hospital.token, city);
        const id = mine.request.request_id;
        assert.equal((await api('PUT', `/requests/${id}/cancel`, { token: hospital.token })).status, 200);
        assert.equal((await api('PUT', `/requests/${id}/cancel`, { token: hospital.token })).status, 409);
    });

    it('auto-expires an overdue request', async () => {
        const mine = await createRequest(hospital.token, city);
        const id = mine.request.request_id;
        await db(`UPDATE hospital_requests SET expires_at = NOW() - INTERVAL '1 minute' WHERE request_id = $1`, [id]);
        const list = await api('GET', '/requests', { token: hospital.token });
        assert.equal(list.data.find((r) => r.request_id === id).status, 'Expired');
        assert.equal((await api('PUT', `/requests/${id}/cancel`, { token: hospital.token })).status, 409);
    });
});
