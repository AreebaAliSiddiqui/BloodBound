# Test report: SCRUM-30 Donor matching

Automated files: `Tests/compatibility.test.js` (unit), `Tests/matching.test.js`. Manual run: 2026-11-02.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| M1 | A+ request, one compatible eligible donor in city | 1 donor alerted | Pass |
| M2 | Donor who donated recently | not alerted (0 alerted) | Pass |
| M3 | Compatibility table (A+, O-, AB+, AB-, B-) | correct donor groups | Not run manually |
| M4 | Incompatible group / other city | not alerted | Not run manually |
| M5 | Plasma uses reversed rules | all eligible donors for O+ recipient | Not run manually |
| M6 | City with no donors | 0 alerted | Not run manually |
