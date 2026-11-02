# Test report: SCRUM-33 Eligibility calculation and eligible-again reminders

Automated files: `Tests/eligibility.test.js` (unit) and `Tests/reminders.test.js` (unit & integration).
Manual run: 2026-11-02.
Scope: Configurable gap rule (via environment/options) and automated "eligible again" reminders for donors.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| E1 | Donor who donated on 2026-11-02 | not eligible, 56 days remaining, next date 2026-12-28 | Pass |
| E2 | Never donated | eligible, FIRST_TIME reminder | Pass (automated) |
| E3 | Boundary: 55 days / 56 days after donation | not eligible / eligible | Pass (automated) |
| E4 | Eligibility evaluated for a future date | eligible after the gap | Pass (automated) |
| E5 | Configurable gap (custom gap days / env override) | respects configured gap value (e.g. 10d vs 56d vs 90d) | Pass (automated) |
| E6 | Donor in cooldown (< 56 days) | COOLDOWN status with remaining days and target date | Pass (automated) |
| E7 | Donor eligible again (>= 56 days) | ELIGIBLE_AGAIN reminder message and status | Pass (automated) |
| E8 | Donor profile GET /api/donors/me | includes live reminder and reminder_status in eligibility | Pass (automated) |
| E9 | Dedicated endpoint GET /api/donors/me/reminders | returns formatted reminder and countdown | Pass (automated) |
| E10 | Non-donor role access restriction | 403 Forbidden for hospital staff | Pass (automated) |

## Automated runs

2026-11-02: 7 of 7 unit tests passed in `Tests/eligibility.test.js`.
2026-11-02: 10 of 10 tests passed in `Tests/reminders.test.js`.
Total: 17 of 17 tests passed (node --test).
