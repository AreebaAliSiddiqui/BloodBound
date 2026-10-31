# User Stories and Acceptance Criteria - Bloodbound

## 1. Donor Role
* **User Story 1.1:** As a registered donor, I want to update my blood group, city, and last donation date so that the system matches me accurately.
  * **Acceptance Criteria:**
    * Donor can successfully edit profile details.
    * Last donation date validates that the donor meets the mandatory waiting period (e.g., 3 months).
* **User Story 1.2:** As an active donor, I want to receive instant emergency blood requests within my city/radius so I can choose to accept and donate.
  * **Acceptance Criteria:**
    * Notification is triggered when a matching request is posted.
    * Donor can click "Accept", which generates a digital transit pass.

## 2. Hospital Staff Role
* **User Story 2.1:** As a hospital staff member, I want to submit urgent blood requests specifying the blood group, units, and urgency level.
  * **Acceptance Criteria:**
    * Form includes dropdowns for blood groups and component types.
    * Submitting broadcasts alerts to eligible local donors immediately.
* **User Story 2.2:** As hospital staff, I want to view the status of active requests to track how many donors have accepted.
  * **Acceptance Criteria:**
    * List view shows real-time acceptance counts and donor status.

## 3. Camp Organizer Role
* **User Story 3.1:** As a camp organizer, I want to schedule donation camps with location details, dates, and operational hours.
  * **Acceptance Criteria:**
    * Organizer can create, update, or cancel camp events.
    * Camps appear on the public list for donor pre-booking.
* **User Story 3.2:** As an organizer, I want to manage time slots and capacity limits to avoid crowding at the camp.
  * **Acceptance Criteria:**
    * System restricts slot bookings once the maximum capacity is reached.

## 4. System Admin Role
* **User Story 4.1:** As a system administrator, I want to moderate user accounts and handle reported issues to ensure platform safety.
  * **Acceptance Criteria:**
    * Admin can view all registered users and deactivate unverified or spam accounts.
* **User Story 4.2:** As an admin, I want to monitor system activity logs to ensure smooth emergency dispatches.
  * **Acceptance Criteria:**
    * Audit trail displays requests, system matches, and status changes.
