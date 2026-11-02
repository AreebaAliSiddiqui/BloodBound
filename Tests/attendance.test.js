// SCRUM-36: check-in and donation recording
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, db, uniqueCity, dayStr, register, registerDonor, createPublishedCamp } = require('./helpers');

const daysFromToday = (dateStr) => (Date.parse(dateStr) - Date.parse(dayStr(0))) / 864e5;

describe('SCRUM-36 attendance and donation recording', () => {
    let org, otherOrg, city, camp, a, b, apptA, apptB;
    before(async () => {
        city = uniqueCity();
        org = await register('camp_organizer');
        otherOrg = await register('camp_organizer');
        camp = await createPublishedCamp(org.token, city);
        a = await registerDonor(city, 'O-');
        b = await registerDonor(city, 'B+');
        for (const d of [a, b]) {
            assert.equal((await api('POST', '/bookings', { token: d.token, body: { camp_id: camp.camp_id } })).status, 201);
        }
        const roster = await api('GET', `/attendance/camps/${camp.camp_id}/roster`, { token: org.token });
        apptA = roster.data.find((r) => r.blood_group === 'O-').appointment_id;
        apptB = roster.data.find((r) => r.blood_group === 'B+').appointment_id;
    });

    const checkin = (id) => api('POST', `/attendance/camps/${camp.camp_id}/checkin`, { token: org.token, body: { appointment_id: id } });
    const donate = (id, component) => api('POST', `/attendance/camps/${camp.camp_id}/donation`,
        { token: org.token, body: { appointment_id: id, ...(component ? { component } : {}) } });

    it('shows the roster with donor details', async () => {
        const r = await api('GET', `/attendance/camps/${camp.camp_id}/roster`, { token: org.token });
        assert.equal(r.data.length, 2);
        assert.equal(r.data[0].attended, false);
        assert.ok(r.data[0].name && r.data[0].phone && r.data[0].blood_group);
    });

    it('requires check-in before a donation can be recorded', async () => {
        assert.equal((await donate(apptA)).status, 409);
    });

    it('records a Whole Blood donation with a 35-day expiry', async () => {
        assert.equal((await checkin(apptA)).status, 200);
        const r = await donate(apptA);
        assert.equal(r.status, 201);
        assert.equal(r.data.unit.blood_group, 'O-');
        assert.equal(r.data.unit.component, 'Whole Blood');
        const days = daysFromToday(r.data.unit.expiry_date);
        assert.ok(days >= 34 && days <= 36, `expiry ${days} days away`);
    });

    it('records platelets with a 5-day expiry and rejects bad components', async () => {
        assert.equal((await checkin(apptB)).status, 200);
        assert.equal((await donate(apptB, 'Water')).status, 400);
        const r = await donate(apptB, 'Platelets');
        assert.equal(r.status, 201);
        const days = daysFromToday(r.data.unit.expiry_date);
        assert.ok(days >= 4 && days <= 6, `expiry ${days} days away`);
    });

    it('rejects a second donation for the same appointment', async () => {
        assert.equal((await donate(apptA)).status, 409);
    });

    it('updates the dashboard, the inventory and the donor eligibility', async () => {
        const d = await api('GET', `/camps/${camp.camp_id}/dashboard`, { token: org.token });
        assert.equal(d.data.booked, 2);
        assert.equal(d.data.checked_in, 2);
        assert.equal(d.data.units_collected, 2);
        const inv = await db('SELECT COUNT(*)::int AS n FROM blood_inventory WHERE source_camp_id = $1', [camp.camp_id]);
        assert.equal(inv.rows[0].n, 2);
        const e = await api('GET', '/donors/me/eligibility', { token: a.token });
        assert.equal(e.data.eligible, false);
        assert.equal(e.data.days_remaining, 56);
    });

    it('restricts access: other organizers and donors cannot use the camp roster', async () => {
        assert.equal((await api('GET', `/attendance/camps/${camp.camp_id}/roster`, { token: otherOrg.token })).status, 404);
        assert.equal((await api('GET', `/attendance/camps/${camp.camp_id}/roster`, { token: a.token })).status, 403);
        assert.equal((await api('POST', `/attendance/camps/${camp.camp_id}/checkin`, { token: org.token, body: {} })).status, 400);
    });
});
