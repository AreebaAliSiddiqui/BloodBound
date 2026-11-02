// SCRUM-28: donor profile
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, uniqueCity, dayStr, register, registerDonor } = require('./helpers');

describe('SCRUM-28 donor profile', () => {
    let donor, city;
    before(async () => { city = uniqueCity(); donor = await registerDonor(city, 'O+'); });

    it('returns the profile with an eligibility block', async () => {
        const r = await api('GET', '/donors/me', { token: donor.token });
        assert.equal(r.status, 200);
        assert.equal(r.data.blood_group, 'O+');
        assert.equal(r.data.city, city);
        assert.equal(r.data.eligibility.eligible, true);
    });

    it('updates the city', async () => {
        const r = await api('PUT', '/donors/me', { token: donor.token, body: { city: city + 'X' } });
        assert.equal(r.status, 200);
        assert.equal(r.data.profile.city, city + 'X');
    });

    it('rejects an invalid blood group', async () => {
        assert.equal((await api('PUT', '/donors/me', { token: donor.token, body: { blood_group: 'Q+' } })).status, 400);
    });

    it('rejects a future last_donation_date', async () => {
        assert.equal((await api('PUT', '/donors/me', { token: donor.token, body: { last_donation_date: '2099-01-01' } })).status, 400);
    });

    it('a recent donation makes the donor not eligible', async () => {
        const r = await api('PUT', '/donors/me', { token: donor.token, body: { last_donation_date: dayStr(-10) } });
        assert.equal(r.status, 200);
        assert.equal(r.data.profile.eligibility.eligible, false);
        const e = await api('GET', '/donors/me/eligibility', { token: donor.token });
        assert.equal(e.data.eligible, false);
        assert.equal(e.data.days_remaining, 46);
    });

    it('only donors can use the donor profile routes', async () => {
        const hospital = await register('hospital_staff');
        assert.equal((await api('GET', '/donors/me', { token: hospital.token })).status, 403);
    });
});
