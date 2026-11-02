// SCRUM-30: donor matching by blood compatibility, city and eligibility
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, uniqueCity, dayStr, register, registerDonor, createRequest } = require('./helpers');

describe('SCRUM-30 matching', () => {
    let city, hospital, oPos, aNeg, oNeg, bPos, abPos, otherCity, recent;
    before(async () => {
        city = uniqueCity();
        hospital = await register('hospital_staff');
        oPos = await registerDonor(city, 'O+');
        aNeg = await registerDonor(city, 'A-');
        oNeg = await registerDonor(city, 'O-');
        bPos = await registerDonor(city, 'B+');
        abPos = await registerDonor(city, 'AB+');
        otherCity = await registerDonor(uniqueCity(), 'O+');
        recent = await registerDonor(city, 'O+');
        await api('PUT', '/donors/me', { token: recent.token, body: { last_donation_date: dayStr(-10) } });
    });

    const alertsFor = async (donor, requestId) =>
        (await api('GET', '/requests/alerts', { token: donor.token })).data.filter((a) => a.request_id === requestId);

    it('alerts only compatible, eligible donors in the same city (A+ request)', async () => {
        const d = await createRequest(hospital.token, city, { blood_group: 'A+' });
        assert.equal(d.donors_alerted, 3); // O+, A-, O-
        const id = d.request.request_id;
        assert.equal((await alertsFor(oPos, id)).length, 1);
        assert.equal((await alertsFor(aNeg, id)).length, 1);
        assert.equal((await alertsFor(oNeg, id)).length, 1);
        assert.equal((await alertsFor(bPos, id)).length, 0);       // incompatible
        assert.equal((await alertsFor(abPos, id)).length, 0);      // incompatible
        assert.equal((await alertsFor(otherCity, id)).length, 0);  // other city
        assert.equal((await alertsFor(recent, id)).length, 0);     // donated 10 days ago
    });

    it('O- request alerts only O- donors', async () => {
        const d = await createRequest(hospital.token, city, { blood_group: 'O-' });
        assert.equal(d.donors_alerted, 1);
    });

    it('plasma matching follows plasma rules (O+ recipient: all eligible donors)', async () => {
        const d = await createRequest(hospital.token, city, { blood_group: 'O+', component: 'Plasma' });
        assert.equal(d.donors_alerted, 5); // O+, A-, O-, B+, AB+ (recent donor excluded)
    });

    it('a request in a city with no donors alerts nobody', async () => {
        const d = await createRequest(hospital.token, uniqueCity());
        assert.equal(d.donors_alerted, 0);
    });
});
