# Bloodbound automated tests

Integration tests for the REST API (Node's built-in test runner, no extra packages).

## Run

1. Start the API: `cd SourceCode/backend && npx nodemon server.js`
2. From the repo root:
   ```
   node --test --test-concurrency=1 "Tests/*.test.js"
   ```
   `API_URL` can override the default `http://localhost:5000/api`.
3. Remove the test data afterwards: `node Tests/cleanup.js`

Every run creates its own users (`*@test.local`) and uses a unique city per test file,
so the tests can be repeated without clashing. The tests use the database in
`SourceCode/backend/.env`.

| File | Ticket |
|---|---|
| auth.test.js | SCRUM-27 registration, login, role access |
| eligibility.test.js | SCRUM-33 eligibility calculation (unit) |
| donors.test.js | SCRUM-28 donor profile |
| requests.test.js | SCRUM-29 blood requests |
| compatibility.test.js, matching.test.js | SCRUM-30 matching |
| accept.test.js | SCRUM-31 accept / withdraw / fulfil |
| camps.test.js | SCRUM-34 camps |
| booking.test.js | SCRUM-35 slot booking |
| attendance.test.js | SCRUM-36 check-in and donation |
| defects.test.js | SCRUM-39 regression tests for fixed defects |

Written reports are in `TestReports/`.
