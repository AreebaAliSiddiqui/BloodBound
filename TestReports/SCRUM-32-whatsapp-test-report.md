# Test report: SCRUM-32 One-tap WhatsApp share link for blood requests

Automated file: `Tests/whatsapp.test.js`. Manual run: 2026-11-02.

| ID | Scenario | Expected | Manual result |
|---|---|---|---|
| W1 | Unit: formatWhatsAppMessage builds template | Formatted message with blood group, urgency, units, hospital, address, link | Pass |
| W2 | Unit: generateWhatsAppUrl generates click-to-chat URL | Starts with https://api.whatsapp.com/send?text= and UTF-8 percent-encoded | Pass |
| W3 | Request creation response contains whatsapp_url | 201, contains valid whatsapp_url | Pass |
| W4 | Hospital fetch request GET /requests/:id | 200, includes whatsapp_url | Pass |
| W5 | GET /requests/:id/share/whatsapp | 200, returns request_id, formatted message and whatsapp_url | Pass |
| W6 | Donor fetches share link for matched request | 200, returns share link | Pass |
| W7 | One-tap redirect (?redirect=true) | 302, redirect to https://api.whatsapp.com/send?text=... | Pass |
| W8 | Invalid UUID format | 400 | Pass (automated) |
| W9 | Unknown UUID request | 404 | Pass (automated) |
| W10 | Unauthenticated share request | 401 | Pass (automated) |

## Automated run

2026-11-02: 10 of 10 automated tests passed (node --test).
