# Test report: SCRUM-35 Slot booking with capacity limits

Automated file: `Tests/booking.test.js`. Manual run: 2026-11-02.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| B1 | Book a slot | 201, slots_left decreases | Pass |
| B2 | Book the same camp twice | 409 | Pass |
| B3 | Slot outside camp hours | 400 | Pass |
| B4 | Donor not eligible on the camp date | 403 with next_eligible_date | Pass |
| B5 | Draft camp / non-donor / missing camp_id | 409 / 403 / 400 | Pass (automated) |
| B6 | Camp at capacity | 409 fully booked | Pass (automated)|
| B7 | Cancel booking frees the place | next donor can book | Pass (automated) |
| B8 | Cancel a booking that does not exist | 409 | Pass (automated) |

## Automated run

2026-11-02: 7 of 7 automated tests passed (node --test).
