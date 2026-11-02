// SCRUM-33: Configurable donation eligibility and eligible-again reminders
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { api, uniqueCity, dayStr, register, registerDonor } = require('./helpers');
const { computeEligibility, getGapDays } = require('../SourceCode/backend/utils/eligibility');

describe('SCRUM-33 configurable eligibility and reminders', () => {
    let donor, city;

    before(async () => {
        city = uniqueCity();
        donor = await registerDonor(city, 'B+');
    });

    describe('unit: configurable rules', () => {
        it('uses default gap when env var is not set or custom gap is passed', () => {
            const originalEnv = process.env.ELIGIBILITY_GAP_DAYS;
            delete process.env.ELIGIBILITY_GAP_DAYS;
            assert.equal(getGapDays(), 56);

            process.env.ELIGIBILITY_GAP_DAYS = '90';
            assert.equal(getGapDays(), 90);

            // Per-call custom gap overrides environment
            assert.equal(getGapDays(30), 30);
            process.env.ELIGIBILITY_GAP_DAYS = originalEnv;
        });

        it('computeEligibility calculates against custom configurable gap', () => {
            const tenDaysAgo = dayStr(-10);
            // With standard 56 days: 46 days remaining
            const res56 = computeEligibility(tenDaysAgo, new Date(), { gap_days: 56 });
            assert.equal(res56.eligible, false);
            assert.equal(res56.days_remaining, 46);

            // With configurable 10-day gap: eligible today
            const res10 = computeEligibility(tenDaysAgo, new Date(), { gap_days: 10 });
            assert.equal(res10.eligible, true);
            assert.equal(res10.days_remaining, 0);
            assert.equal(res10.reminder_status, 'ELIGIBLE_AGAIN');
        });

        it('generates FIRST_TIME reminder for donor who never donated', () => {
            const res = computeEligibility(null);
            assert.equal(res.eligible, true);
            assert.equal(res.reminder_status, 'FIRST_TIME');
            assert.match(res.reminder, /eligible to make your first blood donation/i);
        });

        it('generates COOLDOWN reminder with days remaining for ineligible donor', () => {
            const res = computeEligibility(dayStr(-20), new Date(), { gap_days: 56 });
            assert.equal(res.eligible, false);
            assert.equal(res.reminder_status, 'COOLDOWN');
            assert.equal(res.days_remaining, 36);
            assert.match(res.reminder, /eligible to donate again in 36 days/i);
        });

        it('generates ELIGIBLE_AGAIN reminder once cooldown expires', () => {
            const res = computeEligibility(dayStr(-57), new Date(), { gap_days: 56 });
            assert.equal(res.eligible, true);
            assert.equal(res.reminder_status, 'ELIGIBLE_AGAIN');
            assert.match(res.reminder, /eligible to donate blood again/i);
        });
    });

    describe('integration: donor reminder endpoints', () => {
        it('GET /api/donors/me/reminders returns FIRST_TIME reminder for new donor', async () => {
            const r = await api('GET', '/donors/me/reminders', { token: donor.token });
            assert.equal(r.status, 200);
            assert.equal(r.data.eligible, true);
            assert.equal(r.data.reminder_status, 'FIRST_TIME');
            assert.match(r.data.reminder, /first blood donation/i);
        });

        it('profile GET /api/donors/me includes reminder in eligibility block', async () => {
            const r = await api('GET', '/donors/me', { token: donor.token });
            assert.equal(r.status, 200);
            assert.ok(r.data.eligibility);
            assert.equal(r.data.eligibility.reminder_status, 'FIRST_TIME');
            assert.ok(r.data.eligibility.reminder);
        });

        it('PUT /api/donors/me updates last_donation_date and triggers COOLDOWN reminder', async () => {
            const r = await api('PUT', '/donors/me', {
                token: donor.token,
                body: { last_donation_date: dayStr(-15) }
            });
            assert.equal(r.status, 200);
            assert.equal(r.data.profile.eligibility.eligible, false);
            assert.equal(r.data.profile.eligibility.reminder_status, 'COOLDOWN');

            const rem = await api('GET', '/donors/me/reminders', { token: donor.token });
            assert.equal(rem.status, 200);
            assert.equal(rem.data.eligible, false);
            assert.equal(rem.data.reminder_status, 'COOLDOWN');
            assert.equal(rem.data.days_remaining, 41);
            assert.match(rem.data.reminder, /41 days/);
        });

        it('updating last_donation_date to 60 days ago triggers ELIGIBLE_AGAIN reminder', async () => {
            const sixtyDaysAgo = dayStr(-60);
            const r = await api('PUT', '/donors/me', {
                token: donor.token,
                body: { last_donation_date: sixtyDaysAgo }
            });
            assert.equal(r.status, 200);
            assert.equal(r.data.profile.eligibility.eligible, true);
            assert.equal(r.data.profile.eligibility.reminder_status, 'ELIGIBLE_AGAIN');

            const rem = await api('GET', '/donors/me/reminders', { token: donor.token });
            assert.equal(rem.status, 200);
            assert.equal(rem.data.eligible, true);
            assert.equal(rem.data.reminder_status, 'ELIGIBLE_AGAIN');
            assert.equal(rem.data.days_remaining, 0);
            assert.match(rem.data.reminder, /eligible to donate blood again/i);
        });

        it('non-donor role cannot access /donors/me/reminders (403)', async () => {
            const hospital = await register('hospital_staff');
            const r = await api('GET', '/donors/me/reminders', { token: hospital.token });
            assert.equal(r.status, 403);
        });
    });
});
