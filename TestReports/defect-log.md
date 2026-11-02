# Defect log (SCRUM-39)

| ID | Found in | Description | Cause | Fix | Retest |
|---|---|---|---|---|---|
| DEF-01 | Round 2 manual test, 2026-11-02 | A donor who donated on 2 Nov showed next eligible date 27 Dec instead of 28 Dec (56 days). | The database driver converted DATE values to local-time Date objects, and the UTC conversion moved them back one day. | `config/db.js` returns DATE columns as plain `YYYY-MM-DD` strings (commit `042aa23`). | Pass: next eligible date 2026-12-28. Automated regression test: `Tests/defects.test.js`. |

## Observations, not defects
- The capacity-limit manual test failed once because PowerShell removed the quotes in the helper command. This was a test-tool problem, not an application defect. The automated test `booking.test.js` covers it.
