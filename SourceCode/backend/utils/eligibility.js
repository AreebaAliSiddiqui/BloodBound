// Donor eligibility rule: a minimum gap between whole-blood donations.
// Set ELIGIBILITY_GAP_DAYS in .env to match the value in your SRS.
const GAP_DAYS = parseInt(process.env.ELIGIBILITY_GAP_DAYS, 10) || 56;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function computeEligibility(lastDonationDate, today = new Date()) {
    if (!lastDonationDate) {
        return { eligible: true, next_eligible_date: null, days_remaining: 0, gap_days: GAP_DAYS };
    }
    const last = new Date(lastDonationDate);
    const next = new Date(last.getTime() + GAP_DAYS * MS_PER_DAY);
    const daysRemaining = Math.max(0, Math.ceil((next - today) / MS_PER_DAY));
    return {
        eligible: daysRemaining === 0,
        next_eligible_date: next.toISOString().slice(0, 10),
        days_remaining: daysRemaining,
        gap_days: GAP_DAYS
    };
}

module.exports = { computeEligibility, GAP_DAYS };
