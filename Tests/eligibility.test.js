// SCRUM-33: eligibility calculation (pure unit test, no server needed)
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

delete process.env.ELIGIBILITY_GAP_DAYS; // test the default 56-day gap
const { computeEligibility, GAP_DAYS } = require(path.join(__dirname, '..', 'SourceCode', 'backend', 'utils', 'eligibility'));

const dayStr = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

describe('SCRUM-33 eligibility calculation', () => {
    it('defaults to a 56-day gap', () => assert.equal(GAP_DAYS, 56));

    it('a donor who never donated is eligible', () => {
        const e = computeEligibility(null);
        assert.equal(e.eligible, true);
        assert.equal(e.next_eligible_date, null);
        assert.equal(e.days_remaining, 0);
    });

    it('10 days after a donation: not eligible, 46 days remaining', () => {
        const e = computeEligibility(dayStr(-10));
        assert.equal(e.eligible, false);
        assert.equal(e.days_remaining, 46);
    });

    it('day 55 is still not eligible, day 56 is eligible', () => {
        assert.equal(computeEligibility(dayStr(-55)).eligible, false);
        assert.equal(computeEligibility(dayStr(-56)).eligible, true);
    });

    it('long after a donation: eligible', () => {
        assert.equal(computeEligibility(dayStr(-200)).eligible, true);
    });

    it('next_eligible_date is last donation + 56 days (YYYY-MM-DD)', () => {
        const last = '2026-01-01';
        assert.equal(computeEligibility(last, new Date('2026-01-02')).next_eligible_date, '2026-02-26');
    });

    it('can evaluate eligibility for a future date', () => {
        const last = dayStr(-10);
        const future = new Date(Date.now() + 60 * 864e5);
        assert.equal(computeEligibility(last, future).eligible, true);
    });
});
