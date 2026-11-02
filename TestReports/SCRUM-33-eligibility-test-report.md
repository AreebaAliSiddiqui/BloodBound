# Test report: SCRUM-33 Eligibility calculation

Automated file: `Tests/eligibility.test.js` (unit test). Manual run: 2026-11-02.
Scope: calculation only. Reminders for donors who become eligible again are not built yet.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| E1 | Donor who donated on 2026-11-02 | not eligible, 56 days remaining, next date 2026-12-28 | Pass |
| E2 | Never donated | eligible | Pass (automated) |
| E3 | Boundary: 55 days / 56 days after donation | not eligible / eligible | Pass (automated) |
| E4 | Eligibility evaluated for a future date | eligible after the gap | Pass (automated) |

## Automated run

2026-11-02: 7 of 7 automated tests passed (node --test).
