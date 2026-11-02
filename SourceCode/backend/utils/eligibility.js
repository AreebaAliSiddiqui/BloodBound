// Donor eligibility rule: a minimum gap between whole-blood donations.
// Configurable via ELIGIBILITY_GAP_DAYS in configuration / environment (SCRUM-33).
const DEFAULT_GAP_DAYS = 56;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getGapDays(customGap) {
    if (Number.isInteger(customGap) && customGap > 0) return customGap;
    const envVal = parseInt(process.env.ELIGIBILITY_GAP_DAYS, 10);
    return !isNaN(envVal) && envVal > 0 ? envVal : DEFAULT_GAP_DAYS;
}

function formatReminderMessage(eligible, daysRemaining, nextDate, lastDate) {
    if (!lastDate) {
        return {
            reminder: 'You are eligible to make your first blood donation! Complete health screening to get started.',
            reminder_status: 'FIRST_TIME'
        };
    }
    if (eligible) {
        const lastFormatted = typeof lastDate === 'string' ? lastDate.slice(0, 10) : new Date(lastDate).toISOString().slice(0, 10);
        return {
            reminder: `You are eligible to donate blood again! Your last donation was on ${lastFormatted}. Every donation saves lives.`,
            reminder_status: 'ELIGIBLE_AGAIN'
        };
    }
    return {
        reminder: `You will be eligible to donate again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (on ${nextDate}).`,
        reminder_status: 'COOLDOWN'
    };
}

function computeEligibility(lastDonationDate, today = new Date(), options = {}) {
    const gapDays = getGapDays(typeof options === 'number' ? options : options.gap_days);

    if (!lastDonationDate) {
        const { reminder, reminder_status } = formatReminderMessage(true, 0, null, null);
        return {
            eligible: true,
            next_eligible_date: null,
            days_remaining: 0,
            gap_days: gapDays,
            reminder,
            reminder_status
        };
    }

    const last = new Date(lastDonationDate);
    const next = new Date(last.getTime() + gapDays * MS_PER_DAY);
    const nextFormatted = next.toISOString().slice(0, 10);
    const daysRemaining = Math.max(0, Math.ceil((next - today) / MS_PER_DAY));
    const isEligible = daysRemaining === 0;

    const { reminder, reminder_status } = formatReminderMessage(isEligible, daysRemaining, nextFormatted, lastDonationDate);

    return {
        eligible: isEligible,
        next_eligible_date: nextFormatted,
        days_remaining: daysRemaining,
        gap_days: gapDays,
        reminder,
        reminder_status
    };
}

module.exports = {
    computeEligibility,
    getGapDays,
    formatReminderMessage,
    get GAP_DAYS() {
        return getGapDays();
    }
};
