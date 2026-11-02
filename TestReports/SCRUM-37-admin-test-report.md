# Test report: SCRUM-37 Admin dashboard, user management and request moderation

Automated file: `Tests/admin.test.js`. Manual run: 2026-11-02.
Scope: Administrative oversight, system analytics dashboard, user lifecycle / deactivation, and request moderation (fake / abusive request risk mitigation from D1).

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| A1 | Unauthenticated access to admin routes | 401 Unauthorized | Pass (automated) |
| A2 | Non-admin role access (donor, hospital_staff, camp_organizer) | 403 Forbidden | Pass (automated) |
| A3 | System statistics dashboard (/api/admin/dashboard) | 200, returns users, requests, camps, and recent activity breakdown | Pass |
| A4 | List registered users with filters | 200, filter by role (e.g. donor) and search query | Pass |
| A5 | Single user profile and stats (/api/admin/users/:id) | 200, user details + activity summary | Pass |
| A6 | Admin deactivates user with reason | 200, is_active=false, deactivation_reason saved | Pass |
| A7 | Deactivated user attempts login (/api/auth/login) | 403 Forbidden, deactivation message returned | Pass |
| A8 | Admin reactivates user | 200, is_active=true, login access restored | Pass |
| A9 | Admin attempts self-deactivation | 400 Bad Request, cannot deactivate own account | Pass (automated) |
| A10 | List all requests across hospitals (/api/admin/requests) | 200, full request list with hospital contacts and alert stats | Pass |
| A11 | Admin expires suspicious request (/requests/:id/expire) | 200, status becomes Expired, is_moderated=true | Pass |
| A12 | Donor attempts to accept expired request | 409 Conflict, no longer open | Pass (automated) |
| A13 | Admin removes fake / abusive request (/requests/:id/remove) | 200, status becomes Cancelled, matching logs cancelled | Pass |
| A14 | Donor attempts to accept cancelled/removed request | 409 Conflict, no longer open | Pass (automated) |
| A15 | Moderate non-existent request ID | 404 Not Found | Pass (automated) |
| A16 | Camps monitoring (/api/admin/camps) | 200, list all camps with organizer details and slot counts | Pass |

## Automated run

2026-11-02: 16 of 16 automated tests passed (node --test).
