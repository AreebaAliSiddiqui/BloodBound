// SCRUM-32: One-tap WhatsApp share link for blood requests
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { api, uniqueCity, register, createRequest, BASE } = require('./helpers');
const { formatWhatsAppMessage, generateWhatsAppUrl, WA_BASE_URL } = require('../SourceCode/backend/utils/whatsapp');

describe('SCRUM-32 WhatsApp share link', () => {
    let hospital, donor, city, request;

    before(async () => {
        city = uniqueCity();
        hospital = await register('hospital_staff');
        donor = await register('donor', { city, blood_group: 'A+' });
        const created = await createRequest(hospital.token, city, {
            blood_group: 'A+',
            component: 'Whole Blood',
            units_required: 2,
            urgency: 'Critical',
            hospital_name: 'Memorial Blood Hospital',
            hospital_address: '42 Health Ave'
        });
        request = created.request;
    });

    it('unit: formatWhatsAppMessage builds a formatted message with request details', () => {
        const msg = formatWhatsAppMessage(request, { baseUrl: 'https://bloodbound.example' });
        assert.match(msg, /🚨 \*URGENT BLOOD REQUEST - BLOODBOUND\* 🚨/);
        assert.match(msg, /• \*Blood Group:\* A\+/);
        assert.match(msg, /• \*Component:\* Whole Blood/);
        assert.match(msg, /• \*Units Required:\* 2/);
        assert.match(msg, /• \*Hospital:\* Memorial Blood Hospital/);
        assert.match(msg, new RegExp(`https://bloodbound.example/api/requests/${request.request_id}`));
    });

    it('unit: generateWhatsAppUrl generates a valid WhatsApp click-to-chat URL', () => {
        const url = generateWhatsAppUrl(request);
        assert.ok(url.startsWith(WA_BASE_URL), `expected url to start with ${WA_BASE_URL}`);
        assert.ok(url.includes(encodeURIComponent('A+')), 'expected URL to encode blood group A+');
        assert.ok(url.includes(encodeURIComponent('Memorial Blood Hospital')), 'expected URL to encode hospital name');
    });

    it('integration: request creation includes a valid whatsapp_url in response', async () => {
        const reqData = await createRequest(hospital.token, city, {
            blood_group: 'B+',
            units_required: 1,
            urgency: 'Normal'
        });
        assert.ok(reqData.whatsapp_url);
        assert.ok(reqData.whatsapp_url.startsWith(WA_BASE_URL));
        assert.ok(reqData.whatsapp_url.includes(encodeURIComponent('B+')));
    });

    it('integration: GET /requests/:id includes whatsapp_url', async () => {
        const r = await api('GET', `/requests/${request.request_id}`, { token: hospital.token });
        assert.equal(r.status, 200);
        assert.ok(r.data.whatsapp_url);
        assert.ok(r.data.whatsapp_url.startsWith(WA_BASE_URL));
    });

    it('integration: GET /requests/:id/share/whatsapp returns 200 with message and url', async () => {
        const r = await api('GET', `/requests/${request.request_id}/share/whatsapp`, { token: hospital.token });
        assert.equal(r.status, 200);
        assert.equal(r.data.request_id, request.request_id);
        assert.ok(r.data.message.includes('A+'));
        assert.ok(r.data.whatsapp_url.startsWith(WA_BASE_URL));
    });

    it('integration: GET /requests/:id/share/whatsapp allows donors to fetch share link', async () => {
        const r = await api('GET', `/requests/${request.request_id}/share/whatsapp`, { token: donor.token });
        assert.equal(r.status, 200);
        assert.equal(r.data.request_id, request.request_id);
        assert.ok(r.data.whatsapp_url.startsWith(WA_BASE_URL));
    });

    it('integration: GET /requests/:id/share/whatsapp?redirect=true triggers 302 redirect', async () => {
        const res = await fetch(`${BASE}/requests/${request.request_id}/share/whatsapp?redirect=true`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${hospital.token}` },
            redirect: 'manual'
        });
        assert.equal(res.status, 302);
        const location = res.headers.get('location');
        assert.ok(location && location.startsWith(WA_BASE_URL));
    });

    it('integration: rejects invalid request id format with 400', async () => {
        const r = await api('GET', '/requests/not-a-valid-uuid/share/whatsapp', { token: hospital.token });
        assert.equal(r.status, 400);
    });

    it('integration: returns 404 for non-existent request id', async () => {
        const nonExistent = '00000000-0000-0000-0000-000000000000';
        const r = await api('GET', `/requests/${nonExistent}/share/whatsapp`, { token: hospital.token });
        assert.equal(r.status, 404);
    });

    it('integration: rejects unauthenticated share request with 401', async () => {
        const r = await api('GET', `/requests/${request.request_id}/share/whatsapp`);
        assert.equal(r.status, 401);
    });
});
