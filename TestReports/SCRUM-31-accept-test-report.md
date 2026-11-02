# Test report: SCRUM-31 Donor accepts, contact hidden until then

Automated file: `Tests/accept.test.js`. Manual run: 2026-11-02.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| C1 | Alert before accepting | hospital address and contact are null | Pass |
| C2 | Accept | hospital name, address and phone shown; request becomes Matching | Pass |
| C3 | Hospital view after accept | accepted donor listed with phone | Pass |
| C4 | Withdraw | request returns to Pending | Pass |
| C5 | Fulfil | request Fulfilled, donor not eligible | Pass |
| C6 | Accept a fulfilled request | 409 no longer open | Pass |
| C7 | Second accept by same donor / accept beyond units needed | 409 | Pass (automated) |
| C8 | Unmatched donor accepts | 403 | Pass (automated) |
| C9 | Fulfil with no accepted donor | 409 | Pass (automated) |
| C10 | Accept an expired request | 409 | Pass (automated) |

## Automated run

2026-11-02: 8 of 8 automated tests passed (node --test).
