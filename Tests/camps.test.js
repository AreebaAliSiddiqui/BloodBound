// SCRUM-34: camp creation, publishing, discovery, organizer dashboard
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, uniqueCity, dayStr, register, registerDonor, campBody, createCamp } = require('./helpers');

describe('SCRUM-34 camps', () => {
    let org, otherOrg, donor, city;
    before(async () => {
        city = uniqueCity();
        org = await register('camp_organizer');
        otherOrg = await register('camp_organizer');
        donor = await registerDonor(city, 'O+');
    });

    const discover = async (token, c = city) => (await api('GET', `/camps?city=${c}`, { token })).data;

    it('creates a camp as Draft that donors cannot see yet', async () => {
        const camp = await createCamp(org.token, city);
        assert.equal(camp.status, 'Draft');
        assert.ok(!(await discover(donor.token)).some((c) => c.camp_id === camp.camp_id));
    });

    it('validates the input', async () => {
        const post = (o) => api('POST', '/camps', { token: org.token, body: campBody(city, o) });
        assert.equal((await post({ camp_name: 'abc' })).status, 400);                              // too short
        assert.equal((await post({ start_time: `${dayStr(-1)}T09:00:00Z`, end_time: `${dayStr(-1)}T17:00:00Z` })).status, 400); // past
        assert.equal((await post({ start_time: `${dayStr(1)}T17:00:00Z`, end_time: `${dayStr(1)}T09:00:00Z` })).status, 400);   // end before start
        assert.equal((await post({ max_capacity: 5 })).status, 400);
        assert.equal((await post({ max_capacity: 2000 })).status, 400);
        assert.equal((await post({ city: '' })).status, 400);
    });

    it('only organizers can create camps', async () => {
        assert.equal((await api('POST', '/camps', { token: donor.token, body: campBody(city) })).status, 403);
    });

    it('publishing makes the camp discoverable with the free places', async () => {
        const camp = await createCamp(org.token, city);
        assert.equal((await api('PUT', `/camps/${camp.camp_id}/publish`, { token: org.token })).status, 200);
        const found = (await discover(donor.token)).find((c) => c.camp_id === camp.camp_id);
        assert.ok(found);
        assert.equal(found.slots_left, 10);
        assert.equal((await discover(donor.token, uniqueCity())).length, 0); // city filter
        assert.equal((await api('PUT', `/camps/${camp.camp_id}/publish`, { token: org.token })).status, 409); // already published
    });

    it('edits a camp but not someone else\'s', async () => {
        const camp = await createCamp(org.token, city);
        const ok = await api('PUT', `/camps/${camp.camp_id}`, { token: org.token, body: { max_capacity: 25 } });
        assert.equal(ok.status, 200);
        assert.equal(ok.data.camp.max_capacity, 25);
        assert.equal((await api('PUT', `/camps/${camp.camp_id}`, { token: otherOrg.token, body: { max_capacity: 30 } })).status, 404);
        assert.equal((await api('PUT', `/camps/${camp.camp_id}`, { token: org.token, body: { max_capacity: 3 } })).status, 400);
    });

    it('cancelling removes the camp from discovery', async () => {
        const camp = await createCamp(org.token, city);
        await api('PUT', `/camps/${camp.camp_id}/publish`, { token: org.token });
        assert.equal((await api('PUT', `/camps/${camp.camp_id}/cancel`, { token: org.token })).status, 200);
        assert.ok(!(await discover(donor.token)).some((c) => c.camp_id === camp.camp_id));
        assert.equal((await api('PUT', `/camps/${camp.camp_id}/cancel`, { token: org.token })).status, 409);
    });

    it('shows the organizer dashboard and own camp list', async () => {
        const camp = await createCamp(org.token, city);
        const d = await api('GET', `/camps/${camp.camp_id}/dashboard`, { token: org.token });
        assert.equal(d.status, 200);
        assert.equal(d.data.booked, 0);
        assert.equal(d.data.checked_in, 0);
        assert.equal(d.data.units_collected, 0);
        assert.equal((await api('GET', `/camps/${camp.camp_id}/dashboard`, { token: otherOrg.token })).status, 404);
        const mine = await api('GET', '/camps/mine', { token: org.token });
        assert.ok(mine.data.some((c) => c.camp_id === camp.camp_id));
    });
});
