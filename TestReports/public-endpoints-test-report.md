# Public Landing Endpoints - Test Report

**Feature:** Public read-only endpoints `GET /api/public/camps` and `GET /api/public/live-request` used by the landing page.
**Test file:** `Tests/public.test.js` (run with the backend running: `node Tests/public.test.js`)

| ID | Case | Expected |
|----|------|----------|
| TC-PUB-01 | Camps endpoint without a token | 200 and an array |
| TC-PUB-02 | Camps response fields | Only Published/Ongoing camps; no organizer, contact or coordinate fields |
| TC-PUB-03 | Live-request endpoint without a token | 200 with a `request` key (object or null) |
| TC-PUB-04 | Live-request response fields | No patient identifier, hospital address, phone or ids; not expired |
| TC-PUB-05 | `/api/camps` without a token | Still 401/403 |
| TC-PUB-06 | `/api/requests` without a token | Still 401/403 |

## Result
Paste the console output of the run here, with the date:

```
(run `node Tests/public.test.js` and paste output)
```
