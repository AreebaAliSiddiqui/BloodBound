// SCRUM-39: regression tests for defects found and fixed during testing
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { api, uniqueCity, dayStr, addDays, registerDonor } = require('./helpers');

describe('SCRUM-39 regression', () => {
    it('DEF-01: eligibility dates are not shifted by a day (timezone off-by-one)', async () => {
        const donor = await registerDonor(uniqueCity(), 'O+');
        const last = dayStr(-10);
        const put = await api('PUT', '/donors/me', { token: donor.token, body: { last_donation_date: last } });
        assert.equal(put.data.profile.last_donation_date, last);
        assert.equal(put.data.profile.eligibility.next_eligible_date, addDays(last, 56));
        const get = await api('GET', '/donors/me', { token: donor.token });
        assert.equal(get.data.last_donation_date, last);
        const e = await api('GET', '/donors/me/eligibility', { token: donor.token });
        assert.equal(e.data.next_eligible_date, addDays(last, 56));
    });
});
