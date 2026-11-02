# Test report: SCRUM-34 Camp creation and management

Automated file: `Tests/camps.test.js`. Manual run: 2026-11-02.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| K1 | Create camp | 201, status Draft, not visible to donors | Pass |
| K2 | Invalid name / past date / end before start / capacity 5 or 2000 / empty city | 400 | Pass (automated) |
| K3 | Donor creates a camp | 403 | Pass |
| K4 | Publish, then discovery | camp listed with slots_left 10 | Pass |
| K5 | City filter on discovery | other cities return nothing | Pass (automated) |
| K6 | Publish twice | 409 | Pass (automated) |
| K7 | Edit own camp / edit another organizer's camp | 200 / 404 | Pass (automated) |
| K8 | Cancel, then cancel again | removed from discovery, then 409 | Pass (automated) |
| K9 | Organizer dashboard | booked, checked_in, units_collected | Pass |

## Automated run

2026-11-02: 7 of 7 automated tests passed (node --test).
