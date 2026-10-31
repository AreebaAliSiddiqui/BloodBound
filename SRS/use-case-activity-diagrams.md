# Use-Case and Activity Diagrams - Bloodbound

## 1. Use-Case Overview
The Bloodbound system supports four primary actors interacting with core modules:
* **Donor:** Registers, updates profile, accepts emergency requests, pre-books camp slots.
* **Hospital Staff:** Submits urgent blood requests, tracks donor responses, monitors inventory.
* **Camp Organizer:** Creates donation camps, manages schedules and slot capacity limits.
* **System Admin:** Moderates accounts, oversees system activity, and monitors audit logs.

## 2. Core Use-Case Flows

### Use-Case 1: Emergency Blood Request & Donor Matching
* **Actor:** Hospital Staff, Donor, System Engine
* **Precondition:** Staff is logged in with hospital verification.
* **Main Flow:**
  1. Staff submits an urgent blood request (blood group, units, location).
  2. System records the request and triggers the matching engine.
  3. System identifies eligible active donors within the target radius.
  4. System broadcasts alerts to matched donors.
  5. Donor accepts the alert; system generates a digital transit pass and updates hospital view.

### Use-Case 2: Donation Camp Slot Pre-Booking
* **Actor:** Donor, Camp Organizer
* **Precondition:** Donor profile is active and eligible based on the last donation date.
* **Main Flow:**
  1. Organizer publishes a donation camp event with capacity limits.
  2. Donor browses available camps and selects a time slot.
  3. System verifies slot capacity and confirms the booking.

---

## 3. Activity Diagram Description (Emergency Request Flow)
1. **Start** $\rightarrow$ Hospital staff logs in and clicks "Create Emergency Request".
2. **Form Entry** $\rightarrow$ Inputs blood group, required units, and urgency level.
3. **Validation** $\rightarrow$ System validates input fields. If invalid, prompt error. If valid, save request to database.
4. **Broadcast** $\rightarrow$ Matching algorithm queries active donors within distance threshold.
5. **Notification Sent** $\rightarrow$ Push/SMS notifications dispatched to matched donors.
6. **Donor Action** $\rightarrow$ Donor opens alert and chooses to Accept or Decline.
7. **End** $\rightarrow$ If accepted, generate digital pass and log confirmation.
