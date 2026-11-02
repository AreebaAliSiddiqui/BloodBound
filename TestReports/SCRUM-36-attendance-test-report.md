# Test report: SCRUM-36 Attendance and donation recording

Automated file: `Tests/attendance.test.js`. Manual run: 2026-11-02.
Note: rules come from the schema and the camp spec; `attendance-recording-spec.md` was not compared.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| T1 | Roster | donors with name, phone, blood group | Pass |
| T2 | Donation before check-in | 409 check in first | Pass |
| T3 | Check in, then record Whole Blood | 201, unit with expiry 35 days | Pass |
| T4 | Platelets expiry / invalid component | 5 days / 400 | Pass (automated) |
| T5 | Second donation for same appointment | 409 | Pass |
| T6 | Dashboard after donation | booked, checked_in, units_collected | Pass (1/1/1) |
| T7 | Donor eligibility after donation | not eligible, 56 days | Pass |
| T8 | Donor opens roster | 403 | Pass |
| T9 | Another organizer opens roster | 404 | Pass (automated) |

## Automated run

2026-11-02: 7 of 7 automated tests passed (node --test).
