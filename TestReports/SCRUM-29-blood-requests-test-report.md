# Test report: SCRUM-29 Blood requests

Automated file: `Tests/requests.test.js`. Manual run: 2026-11-02.
Status mapping to the spec: Pending = Open, Matching = In-Progress.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| R1 | Create Critical request | 201, status Pending, expires in 4 h | Pass (status), expiry Pass (automated) |
| R2 | High / Normal urgency | expires in 12 h / 24 h | Pass (automated) |
| R3 | Invalid blood group, units 0 or 11, bad component/urgency, empty city | 400 | Pass (automated) |
| R4 | Donor creates a request | 403 | Pass (donor blocked from hospital routes) |
| R5 | List own requests only | own requests, with counts | Pass (automated) |
| R6 | Another hospital views my request | 404 | Pass (automated) |
| R7 | Cancel, then cancel again | 200, then 409 | Pass |
| R8 | Overdue request | status becomes Expired | Pass (automated) |

## Automated run

2026-11-02: 8 of 8 automated tests passed (node --test).
