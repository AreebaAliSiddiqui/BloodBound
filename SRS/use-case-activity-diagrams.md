# Use-Case and Activity Diagrams - Bloodbound

## 1. Use-Case Overview
The Bloodbound system supports four primary actors interacting with core modules:
* **Donor:** Registers, updates profile, accepts emergency requests, pre-books camp slots.
* **Hospital Staff:** Submits urgent blood requests, tracks donor responses, monitors inventory.
* **Camp Organizer:** Creates donation camps, manages schedules and slot capacity limits.
* **System Admin:** Moderates accounts, oversees system activity, and monitors audit logs.

---

## 2. Activity Diagram (Emergency Request Flow)
Below is the visual flowchart showing how an emergency blood request flows from submission to donor notification:

```mermaid
graph TD
    A[Hospital Staff Login] --> B[Create Emergency Request]
    B --> C{Input Valid?}
    C -->|No| B
    C -->|Yes| D[Save Request to Database]
    D --> E[Trigger Matching Engine]
    E --> F[Query Eligible Donors in Radius]
    F --> G[Broadcast Notification / SMS]
    G --> H[Donor Receives Alert]
    H --> I{Donor Action}
    I -->|Accept| J[Generate Digital Pass & Update Status]
    I -->|Decline| K[Log Rejection & Notify Next Donor]
    J --> L[End]
    K --> L
