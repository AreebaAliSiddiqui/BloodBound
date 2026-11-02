# Test case register: Bloodbound

Complete list of the test cases for the Bloodbound back end. Test code is in `Tests/`; the written reports are in `TestReports/`.
Compiled 2 November 2026 from the existing test reports.

## 1. Summary

| Ticket | Feature | Test file(s) in `Tests/` | Automated tests | Manual scenarios | Report in `TestReports/` |
|---|---|---|---|---|---|
| SCRUM-27 | Registration, login, 4-role access | `auth.test.js` | 8 | 9 (A1-A9) | `SCRUM-27-auth-test-report.md` |
| SCRUM-28 | Donor profile | `donors.test.js` | 6 | 6 (D1-D6) | `SCRUM-28-donor-profile-test-report.md` |
| SCRUM-29 | Blood requests | `requests.test.js` | 8 | 8 (R1-R8) | `SCRUM-29-blood-requests-test-report.md` |
| SCRUM-30 | Donor matching and compatibility | `compatibility.test.js`, `matching.test.js` | 11 | 6 (M1-M6) | `SCRUM-30-matching-test-report.md` |
| SCRUM-31 | Accept, withdraw, fulfil | `accept.test.js` | 8 | 10 (C1-C10) | `SCRUM-31-accept-test-report.md` |
| SCRUM-32 | WhatsApp share link | `whatsapp.test.js` | 10 | 10 (W1-W10) | `SCRUM-32-whatsapp-test-report.md` |
| SCRUM-33 | Eligibility and reminders | `eligibility.test.js`, `reminders.test.js` | 17 (7 + 10) | 10 (E1-E10) | `SCRUM-33-eligibility-test-report.md` |
| SCRUM-34 | Camp management | `camps.test.js` | 7 | 9 (K1-K9) | `SCRUM-34-camps-test-report.md` |
| SCRUM-35 | Slot booking and capacity | `booking.test.js` | 7 | 8 (B1-B8) | `SCRUM-35-booking-test-report.md` |
| SCRUM-36 | Attendance and donation recording | `attendance.test.js` | 7 | 9 (T1-T9) | `SCRUM-36-attendance-test-report.md` |
| SCRUM-37 | Admin dashboard and moderation | `admin.test.js` | 16 | 16 (A1-A16) | `SCRUM-37-admin-test-report.md` |
| SCRUM-39 | Defect DEF-01 regression | `defects.test.js` | 1 | 1 (DEF-01) | `defect-log.md` |
| | **Total** | | **106** | **102** | |
| Public endpoints | Landing page endpoints | `public.test.js` | 6 (not yet run) | none | `public-endpoints-test-report.md` |

The 106 automated tests all passed on 2026-11-02 (`node --test --test-concurrency=1 "Tests/*.test.js"`, see `automated-test-run-2026-11-02.md`). A manual scenario can cover several checks, which is why the manual and automated counts differ. IDs repeat across tickets (A1-A9 appear in both SCRUM-27 and SCRUM-37), so always quote the ticket with the ID.

## 2. Test cases by ticket

### SCRUM-27 Registration, login, 4-role access (`auth.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| A1 | Register donor | 201, no password hash returned | Pass |
| A2 | Register hospital_staff, camp_organizer | 201 | Pass |
| A3 | Register as admin | 400 rejected | Pass |
| A4 | Duplicate email | 400 | Pass (automated) |
| A5 | Missing fields, short password, donor without blood group | 400 | Pass (automated) |
| A6 | Login with correct password | 200, token and role | Pass |
| A7 | Login with wrong password | 400 | Pass |
| A8 | No token or invalid token | 401 / 403 | Pass (automated) |
| A9 | Donor opens hospital-only route | 403 | Pass |

### SCRUM-28 Donor profile (`donors.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| D1 | Get own profile | blood group, city, eligibility block | Pass (automated) |
| D2 | Update city | 200, new city | Pass (automated) |
| D3 | Invalid blood group | 400 | Pass (automated) |
| D4 | Future last_donation_date | 400 | Pass |
| D5 | Recent donation | not eligible, days remaining | Pass |
| D6 | Hospital user opens donor profile | 403 | Pass (automated) |

### SCRUM-29 Blood requests (`requests.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| R1 | Create Critical request | 201, status Pending, expires in 4 h | Pass |
| R2 | High / Normal urgency | expires in 12 h / 24 h | Pass (automated) |
| R3 | Invalid blood group, units 0 or 11, bad component or urgency, empty city | 400 | Pass (automated) |
| R4 | Donor creates a request | 403 | Pass |
| R5 | List own requests only | own requests with counts | Pass (automated) |
| R6 | Another hospital views my request | 404 | Pass (automated) |
| R7 | Cancel, then cancel again | 200, then 409 | Pass |
| R8 | Overdue request | status becomes Expired | Pass (automated) |

### SCRUM-30 Donor matching (`compatibility.test.js`, `matching.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| M1 | A+ request, one compatible eligible donor in city | 1 donor alerted | Pass |
| M2 | Donor who donated recently | not alerted | Pass |
| M3 | Compatibility table (A+, O-, AB+, AB-, B-) | correct donor groups | Pass (automated) |
| M4 | Incompatible group or other city | not alerted | Pass (automated) |
| M5 | Plasma uses reversed rules | all eligible donors for O+ recipient | Pass (automated) |
| M6 | City with no donors | 0 alerted | Pass (automated) |

### SCRUM-31 Accept, withdraw, fulfil (`accept.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| C1 | Alert before accepting | hospital address and contact are null | Pass |
| C2 | Accept | hospital details shown, request becomes Matching | Pass |
| C3 | Hospital view after accept | accepted donor listed with phone | Pass |
| C4 | Withdraw | request returns to Pending | Pass |
| C5 | Fulfil | request Fulfilled, donor not eligible | Pass |
| C6 | Accept a fulfilled request | 409 no longer open | Pass |
| C7 | Second accept by same donor, or accept beyond units needed | 409 | Pass (automated) |
| C8 | Unmatched donor accepts | 403 | Pass (automated) |
| C9 | Fulfil with no accepted donor | 409 | Pass (automated) |
| C10 | Accept an expired request | 409 | Pass (automated) |

### SCRUM-32 WhatsApp share link (`whatsapp.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| W1 | formatWhatsAppMessage builds the template | message with blood group, urgency, units, hospital, address, link | Pass |
| W2 | generateWhatsAppUrl builds click-to-chat URL | starts with the WhatsApp send URL, UTF-8 percent-encoded | Pass |
| W3 | Request creation response | 201, contains valid whatsapp_url | Pass |
| W4 | Hospital fetches GET /requests/:id | 200, includes whatsapp_url | Pass |
| W5 | GET /requests/:id/share/whatsapp | 200, request_id, message and whatsapp_url | Pass |
| W6 | Donor fetches share link for matched request | 200 | Pass |
| W7 | One-tap redirect (?redirect=true) | 302 to WhatsApp | Pass |
| W8 | Invalid UUID | 400 | Pass (automated) |
| W9 | Unknown request | 404 | Pass (automated) |
| W10 | Unauthenticated share request | 401 | Pass (automated) |

### SCRUM-33 Eligibility and reminders (`eligibility.test.js`, `reminders.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| E1 | Donor who donated on 2026-11-02 | not eligible, 56 days remaining, next date 2026-12-28 | Pass |
| E2 | Never donated | eligible, FIRST_TIME reminder | Pass (automated) |
| E3 | Boundary: 55 days and 56 days after donation | not eligible / eligible | Pass (automated) |
| E4 | Eligibility evaluated for a future date | eligible after the gap | Pass (automated) |
| E5 | Configurable gap (custom days or env override) | respects the configured gap | Pass (automated) |
| E6 | Donor in cooldown | COOLDOWN status with remaining days and date | Pass (automated) |
| E7 | Donor eligible again | ELIGIBLE_AGAIN message and status | Pass (automated) |
| E8 | GET /api/donors/me | includes reminder and reminder_status | Pass (automated) |
| E9 | GET /api/donors/me/reminders | formatted reminder and countdown | Pass (automated) |
| E10 | Non-donor role access | 403 for hospital staff | Pass (automated) |

### SCRUM-34 Camp management (`camps.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| K1 | Create camp | 201, status Draft, not visible to donors | Pass |
| K2 | Invalid name, past date, end before start, capacity 5 or 2000, empty city | 400 | Pass (automated) |
| K3 | Donor creates a camp | 403 | Pass |
| K4 | Publish, then discovery | camp listed with slots_left 10 | Pass |
| K5 | City filter on discovery | other cities return nothing | Pass (automated) |
| K6 | Publish twice | 409 | Pass (automated) |
| K7 | Edit own camp / another organizer's camp | 200 / 404 | Pass (automated) |
| K8 | Cancel, then cancel again | removed from discovery, then 409 | Pass (automated) |
| K9 | Organizer dashboard | booked, checked_in, units_collected | Pass |

### SCRUM-35 Slot booking (`booking.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| B1 | Book a slot | 201, slots_left decreases | Pass |
| B2 | Book the same camp twice | 409 | Pass |
| B3 | Slot outside camp hours | 400 | Pass |
| B4 | Donor not eligible on the camp date | 403 with next_eligible_date | Pass |
| B5 | Draft camp, non-donor, missing camp_id | 409 / 403 / 400 | Pass (automated) |
| B6 | Camp at capacity | 409 fully booked | Pass (automated) |
| B7 | Cancel booking frees the place | next donor can book | Pass (automated) |
| B8 | Cancel a booking that does not exist | 409 | Pass (automated) |

### SCRUM-36 Attendance and donation recording (`attendance.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| T1 | Roster | donors with name, phone, blood group | Pass |
| T2 | Donation before check-in | 409 check in first | Pass |
| T3 | Check in, then record Whole Blood | 201, unit with 35-day expiry | Pass |
| T4 | Platelets expiry, invalid component | 5 days / 400 | Pass (automated) |
| T5 | Second donation for same appointment | 409 | Pass |
| T6 | Dashboard after donation | booked, checked_in, units_collected (1/1/1) | Pass |
| T7 | Donor eligibility after donation | not eligible, 56 days | Pass |
| T8 | Donor opens roster | 403 | Pass |
| T9 | Another organizer opens roster | 404 | Pass (automated) |

### SCRUM-37 Admin dashboard and moderation (`admin.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| A1 | Unauthenticated access to admin routes | 401 | Pass (automated) |
| A2 | Non-admin roles access admin routes | 403 | Pass (automated) |
| A3 | Dashboard statistics | 200, users, requests, camps, recent activity | Pass |
| A4 | List users with role filter and search | 200 | Pass |
| A5 | Single user profile and stats | 200, details and activity summary | Pass |
| A6 | Admin deactivates user with reason | 200, is_active false, reason saved | Pass |
| A7 | Deactivated user tries to log in | 403 with deactivation message | Pass |
| A8 | Admin reactivates user | 200, login restored | Pass |
| A9 | Admin deactivates own account | 400 | Pass (automated) |
| A10 | List all requests across hospitals | 200, contacts and alert stats | Pass |
| A11 | Admin expires suspicious request | 200, status Expired, is_moderated true | Pass |
| A12 | Donor accepts an expired request | 409 | Pass (automated) |
| A13 | Admin removes fake or abusive request | 200, status Cancelled, matching logs cancelled | Pass |
| A14 | Donor accepts a cancelled request | 409 | Pass (automated) |
| A15 | Moderate a non-existent request | 404 | Pass (automated) |
| A16 | Admin camps monitoring | 200, camps with organizer and slot counts | Pass |

### SCRUM-39 Defect regression (`defects.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| DEF-01 | Donor who donated on 2 Nov shows the correct next eligible date | 2026-12-28 (56 days), not 27 Dec | Pass |

### Public landing endpoints (`public.test.js`)
| ID | Scenario | Expected | Result |
|---|---|---|---|
| TC-PUB-01 | Camps endpoint without a token | 200, array | Not yet run |
| TC-PUB-02 | Camps response fields | only open camps, no private fields | Not yet run |
| TC-PUB-03 | Live-request endpoint without a token | 200 with a `request` key | Not yet run |
| TC-PUB-04 | Live-request response fields | no patient, address, phone or id fields, not expired | Not yet run |
| TC-PUB-05 | `/api/camps` without a token | still 401 / 403 | Not yet run |
| TC-PUB-06 | `/api/requests` without a token | still 401 / 403 | Not yet run |
