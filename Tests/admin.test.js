// SCRUM-37: Admin dashboard, user management and request moderation
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { api, uniqueCity, register, registerDonor, registerAdmin, createRequest, createPublishedCamp } = require('./helpers');

describe('SCRUM-37 Admin dashboard, user management and request moderation', () => {
    let admin, donor, hospital, organizer, city;

    before(async () => {
        city = uniqueCity();
        admin = await registerAdmin();
        donor = await registerDonor(city, 'O+');
        hospital = await register('hospital_staff');
        organizer = await register('camp_organizer');
    });

    describe('Role access & security', () => {
        it('rejects unauthenticated access with 401', async () => {
            const r = await api('GET', '/admin/dashboard');
            assert.equal(r.status, 401);
        });

        it('rejects donor role with 403', async () => {
            const r = await api('GET', '/admin/dashboard', { token: donor.token });
            assert.equal(r.status, 403);
        });

        it('rejects hospital_staff role with 403', async () => {
            const r = await api('GET', '/admin/dashboard', { token: hospital.token });
            assert.equal(r.status, 403);
        });

        it('rejects camp_organizer role with 403', async () => {
            const r = await api('GET', '/admin/dashboard', { token: organizer.token });
            assert.equal(r.status, 403);
        });
    });

    describe('Admin dashboard', () => {
        it('returns comprehensive system overview statistics', async () => {
            const r = await api('GET', '/admin/dashboard', { token: admin.token });
            assert.equal(r.status, 200);
            assert.ok(r.data.users, 'expected users stats');
            assert.ok(r.data.users.total >= 4, 'expected at least 4 users in database');
            assert.ok(r.data.users.donors >= 1);
            assert.ok(r.data.users.hospital_staff >= 1);
            assert.ok(r.data.requests, 'expected requests stats');
            assert.ok(r.data.camps, 'expected camps stats');
            assert.ok(r.data.recent_activity, 'expected recent activity snapshot');
        });
    });

    describe('User management', () => {
        it('lists users and supports role filtering', async () => {
            const r = await api('GET', '/admin/users?role=donor', { token: admin.token });
            assert.equal(r.status, 200);
            assert.ok(Array.isArray(r.data));
            assert.ok(r.data.length >= 1);
            assert.ok(r.data.every((u) => u.role === 'donor'));
            assert.ok(r.data.some((u) => u.email === donor.email));
        });

        it('supports search by user email', async () => {
            const r = await api('GET', `/admin/users?search=${donor.email}`, { token: admin.token });
            assert.equal(r.status, 200);
            assert.equal(r.data.length, 1);
            assert.equal(r.data[0].email, donor.email);
        });

        it('retrieves single user profile with activity stats', async () => {
            const r = await api('GET', `/admin/users/${donor.user.user_id}`, { token: admin.token });
            assert.equal(r.status, 200);
            assert.equal(r.data.user.email, donor.email);
            assert.ok(r.data.stats !== undefined);
        });

        it('admin deactivates a user with reason', async () => {
            const deact = await api('PUT', `/admin/users/${donor.user.user_id}/deactivate`, {
                token: admin.token,
                body: { reason: 'Suspected spam activity from D1 risk review' }
            });
            assert.equal(deact.status, 200);
            assert.equal(deact.data.user.is_active, false);
            assert.equal(deact.data.user.deactivation_reason, 'Suspected spam activity from D1 risk review');

            // Deactivated user cannot log in
            const loginRes = await api('POST', '/auth/login', {
                body: { email: donor.email, password: 'password123' }
            });
            assert.equal(loginRes.status, 403);
            assert.match(loginRes.data.error, /deactivated/i);
        });

        it('admin reactivates a user and restores login access', async () => {
            const react = await api('PUT', `/admin/users/${donor.user.user_id}/reactivate`, {
                token: admin.token
            });
            assert.equal(react.status, 200);
            assert.equal(react.data.user.is_active, true);

            // User can log in again
            const loginRes = await api('POST', '/auth/login', {
                body: { email: donor.email, password: 'password123' }
            });
            assert.equal(loginRes.status, 200);
            assert.ok(loginRes.data.token);
        });

        it('admin cannot deactivate their own account', async () => {
            const r = await api('PUT', `/admin/users/${admin.user.user_id}/deactivate`, {
                token: admin.token,
                body: { reason: 'Test self-deactivate' }
            });
            assert.equal(r.status, 400);
            assert.match(r.data.error, /cannot deactivate their own account/i);
        });
    });

    describe('Request moderation (fake / abusive request risk from D1)', () => {
        let req1, req2;

        before(async () => {
            const c1 = await createRequest(hospital.token, city, {
                patient_identifier: 'SUSP-001',
                urgency: 'Critical',
                units_required: 1
            });
            req1 = c1.request;

            const c2 = await createRequest(hospital.token, city, {
                patient_identifier: 'FAKE-999',
                urgency: 'Normal',
                units_required: 2
            });
            req2 = c2.request;
        });

        it('admin lists all hospital requests with moderation flags', async () => {
            const r = await api('GET', '/admin/requests', { token: admin.token });
            assert.equal(r.status, 200);
            assert.ok(Array.isArray(r.data));
            assert.ok(r.data.some((item) => item.request_id === req1.request_id));
        });

        it('admin force-expires a suspicious request', async () => {
            const r = await api('PUT', `/admin/requests/${req1.request_id}/expire`, {
                token: admin.token,
                body: { reason: 'Suspicious request flagged by automated filter' }
            });
            assert.equal(r.status, 200);
            assert.equal(r.data.request.status, 'Expired');
            assert.equal(r.data.request.is_moderated, true);
            assert.equal(r.data.request.moderated_by, admin.user.user_id);
            assert.equal(r.data.request.moderation_reason, 'Suspicious request flagged by automated filter');

            // Donor cannot accept an expired request
            const acceptRes = await api('POST', `/requests/${req1.request_id}/accept`, { token: donor.token });
            assert.equal(acceptRes.status, 409);
        });

        it('admin cancels/removes a fake or abusive request', async () => {
            const r = await api('PUT', `/admin/requests/${req2.request_id}/remove`, {
                token: admin.token,
                body: { reason: 'Confirmed abusive request from unverified patient' }
            });
            assert.equal(r.status, 200);
            assert.equal(r.data.request.status, 'Cancelled');
            assert.equal(r.data.request.is_moderated, true);
            assert.equal(r.data.request.moderated_by, admin.user.user_id);

            // Donor cannot accept a cancelled request
            const acceptRes = await api('POST', `/requests/${req2.request_id}/accept`, { token: donor.token });
            assert.equal(acceptRes.status, 409);
        });

        it('returns 404 when moderating a non-existent request', async () => {
            const nonExistent = '00000000-0000-0000-0000-000000000000';
            const r = await api('PUT', `/admin/requests/${nonExistent}/expire`, { token: admin.token });
            assert.equal(r.status, 404);
        });
    });

    describe('Camps monitoring', () => {
        it('admin lists all camps with organizer details and slot stats', async () => {
            await createPublishedCamp(organizer.token, city);
            const r = await api('GET', '/admin/camps', { token: admin.token });
            assert.equal(r.status, 200);
            assert.ok(Array.isArray(r.data));
            assert.ok(r.data.length >= 1);
            assert.ok(r.data[0].organizer_name);
        });
    });
});
