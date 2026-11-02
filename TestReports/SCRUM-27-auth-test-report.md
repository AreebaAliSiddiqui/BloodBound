# Test report: SCRUM-27 Registration, login, 4-role access

Automated file: `Tests/auth.test.js`. Manual run: 2026-11-02.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| A1 | Register donor | 201, no password hash returned | Pass |
| A2 | Register hospital_staff, camp_organizer | 201 | Pass |
| A3 | Register as admin | 400 rejected | Pass |
| A4 | Duplicate email | 400 | Pass (automated) |
| A5 | Missing fields / short password / donor without blood group | 400 | Pass (automated) |
| A6 | Login with correct password | 200 + token + role | Pass |
| A7 | Login with wrong password | 400 | Pass |
| A8 | No token / invalid token | 401 / 403 | Pass (automated) |
| A9 | Donor opens hospital-only route | 403 | Pass |

Defects: none found by these tests.

## Automated run

2026-11-02: 8 of 8 automated tests passed (node --test).
