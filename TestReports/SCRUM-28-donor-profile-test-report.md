# Test report: SCRUM-28 Donor profile

Automated file: `Tests/donors.test.js`. Manual run: 2026-11-02.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| D1 | Get own profile | blood group, city, eligibility block | Pass (automated) |
| D2 | Update city | 200, new city | Pass (automated) |
| D3 | Invalid blood group | 400 | Pass (automated) |
| D4 | Future last_donation_date | 400 | Pass |
| D5 | Recent donation | not eligible, days remaining | Pass |
| D6 | Hospital user opens donor profile | 403 | Pass (automated) |

## Automated run

2026-11-02: 6 of 6 automated tests passed (node --test).
