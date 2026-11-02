// SCRUM-31: donor accepts a request; contact details hidden until then; withdraw; fulfil
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, uniqueCity, db, register, registerDonor, createRequest } = require('./helpers');

describe('SCRUM-31 accept / withdraw / fulfil', () => {
    let city, hospital, donor1, donor2, outsider, id;
    before(async () => {
        city = uniqueCity();
        hospital = await register('hospital_staff', { phone: '03111111111' });
        donor1 = await registerDonor(city, 'O+');
        donor2 = await registerDonor(city, 'O-');
        outsider = await registerDonor(uniqueCity(), 'O+');
        const d = await createRequest(hospital.token, city, { blood_group: 'A+', units_required: 1 });
        assert.equal(d.donors_alerted, 2);
        id = d.request.request_id;
    });

    const alert = async (donor) => (await api('GET', '/requests/alerts', { token: donor.token })).data.find((a) => a.request_id === id);

    it('hides hospital address and contact before accepting', async () => {
        const a = await alert(donor1);
        assert.equal(a.response_status, 'Pending');
        assert.equal(a.hospital_address, null);
        assert.equal(a.hospital_contact, null);
        assert.equal(a.patient_identifier, undefined); // patient id never shown to donors
    });

    it('accepting reveals the hospital contact and moves the request to Matching', async () => {
        const r = await api('POST', `/requests/${id}/accept`, { token: donor1.token });
        assert.equal(r.status, 200);
        assert.equal(r.data.hospital_contact, '03111111111');
        assert.equal(r.data.hospital_address, 'Main Road');
        const v = await api('GET', `/requests/${id}`, { token: hospital.token });
        assert.equal(v.data.request.status, 'Matching');
        assert.equal(v.data.donors_accepted, 1);
        assert.equal(v.data.accepted_donors.length, 1);
        assert.ok(v.data.accepted_donors[0].phone);
        assert.equal((await alert(donor1)).hospital_contact, '03111111111');
    });

    it('rejects a second accept by the same donor and an accept beyond the units needed', async () => {
        assert.equal((await api('POST', `/requests/${id}/accept`, { token: donor1.token })).status, 409);
        assert.equal((await api('POST', `/requests/${id}/accept`, { token: donor2.token })).status, 409); // 1 unit already covered
    });

    it('withdraw returns the request to Pending and frees the place', async () => {
        assert.equal((await api('POST', `/requests/${id}/withdraw`, { token: donor2.token })).status, 409); // never accepted
        assert.equal((await api('POST', `/requests/${id}/withdraw`, { token: donor1.token })).status, 200);
        assert.equal((await api('GET', `/requests/${id}`, { token: hospital.token })).data.request.status, 'Pending');
        assert.equal((await api('POST', `/requests/${id}/accept`, { token: donor2.token })).status, 200);
    });

    it('a donor who was not matched cannot accept', async () => {
        const other = await createRequest(hospital.token, city, { blood_group: 'A+' });
        assert.equal((await api('POST', `/requests/${other.request.request_id}/accept`, { token: outsider.token })).status, 403);
    });

    it('cannot fulfil a request that has no accepted donor', async () => {
        const pending = await createRequest(hospital.token, city, { blood_group: 'A+' });
        assert.equal((await api('PUT', `/requests/${pending.request.request_id}/fulfill`, { token: hospital.token })).status, 409);
    });

    it('fulfilling updates the donor record and closes the request', async () => {
        const f = await api('PUT', `/requests/${id}/fulfill`, { token: hospital.token });
        assert.equal(f.status, 200);
        assert.equal((await api('GET', `/requests/${id}`, { token: hospital.token })).data.request.status, 'Fulfilled');
        const e = await api('GET', '/donors/me/eligibility', { token: donor2.token });
        assert.equal(e.data.eligible, false);
        assert.equal((await api('POST', `/requests/${id}/accept`, { token: donor1.token })).status, 409); // no longer open
    });

    it('cannot accept an expired request', async () => {
        const d = await createRequest(hospital.token, city, { blood_group: 'A+' });
        await db(`UPDATE hospital_requests SET expires_at = NOW() - INTERVAL '1 minute' WHERE request_id = $1`, [d.request.request_id]);
        assert.equal((await api('POST', `/requests/${d.request.request_id}/accept`, { token: donor1.token })).status, 409);
    });
});
