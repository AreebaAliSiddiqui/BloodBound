// SCRUM-35: slot booking with capacity limits
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, db, uniqueCity, dayStr, register, registerDonor, createCamp, createPublishedCamp } = require('./helpers');

describe('SCRUM-35 slot booking', () => {
    let org, city, camp, a, b, c, recent;
    before(async () => {
        city = uniqueCity();
        org = await register('camp_organizer');
        camp = await createPublishedCamp(org.token, city);
        a = await registerDonor(city, 'O+');
        b = await registerDonor(city, 'A+');
        c = await registerDonor(city, 'B+');
        recent = await registerDonor(city, 'O-');
        await api('PUT', '/donors/me', { token: recent.token, body: { last_donation_date: dayStr(-10) } });
    });

    const book = (donor, body) => api('POST', '/bookings', { token: donor.token, body: { camp_id: camp.camp_id, ...body } });

    it('books the default slot and reports the places left', async () => {
        const r = await book(a);
        assert.equal(r.status, 201);
        assert.equal(r.data.slots_left, 9);
        const mine = await api('GET', '/bookings/mine', { token: a.token });
        assert.equal(mine.data.length, 1);
        assert.equal(mine.data[0].camp_id, camp.camp_id);
    });

    it('rejects a duplicate booking', async () => {
        assert.equal((await book(a)).status, 409);
    });

    it('rejects a slot outside the camp hours', async () => {
        assert.equal((await book(b, { slot_time: `${dayStr(1)}T20:00:00Z` })).status, 400);
        assert.equal((await book(b, { slot_time: `${dayStr(1)}T06:00:00Z` })).status, 400);
    });

    it('rejects a donor who will not be eligible on that date', async () => {
        const r = await book(recent);
        assert.equal(r.status, 403);
        assert.ok(r.data.next_eligible_date);
    });

    it('rejects booking a Draft camp and non-donors', async () => {
        const draft = await createCamp(org.token, city);
        const r = await api('POST', '/bookings', { token: b.token, body: { camp_id: draft.camp_id } });
        assert.equal(r.status, 409);
        const hospital = await register('hospital_staff');
        assert.equal((await book(hospital)).status, 403);
        assert.equal((await api('POST', '/bookings', { token: b.token, body: {} })).status, 400);
    });

    it('enforces the capacity limit and frees the place when a booking is cancelled', async () => {
        await db('UPDATE camps SET max_capacity = 1 WHERE camp_id = $1', [camp.camp_id]);
        const full = await book(b);
        assert.equal(full.status, 409);
        assert.match(full.data.error, /fully booked/);
        assert.equal((await api('DELETE', `/bookings/${camp.camp_id}`, { token: a.token })).status, 200);
        assert.equal((await api('GET', '/bookings/mine', { token: a.token })).data.length, 0);
        assert.equal((await book(b)).status, 201);
        assert.equal((await book(c)).status, 409); // full again
    });

    it('cannot cancel a booking that does not exist', async () => {
        assert.equal((await api('DELETE', `/bookings/${camp.camp_id}`, { token: a.token })).status, 409);
        assert.equal((await api('DELETE', '/bookings/not-a-uuid', { token: a.token })).status, 400);
    });
});
