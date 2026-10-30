# System Requirements Specification (SRS) - Bloodbound

## 1. Functional Requirements

| Requirement ID | Module | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | User Auth | Users must be able to register, log in securely, and select their user role (Donor, Hospital Staff, Camp Organizer, System Admin). | High |
| **FR-02** | Donor Profile | Donors must be able to manage their profile, including blood group, city/location, last donation date, and health status flags. | High |
| **FR-03** | Request Management | Hospital staff must be able to submit urgent blood requests specifying blood group, component type, units required, and priority level. | High |
| **FR-04** | Matching Engine | The system must automatically match emergency requests with eligible donors within a configurable radius (5km to 25km). | High |
| **FR-05** | Alert System | The system must broadcast notifications and SMS alerts to matched active donors upon emergency request creation. | High |
| **FR-06** | Donor Response | Donors must be able to accept or decline emergency alerts, generating a digital transit pass upon acceptance. | High |
| **FR-07** | Camp Management | Camp organizers must be able to schedule donation events with location, target donor count, and operational hours. | Medium |
| **FR-08** | Slot Booking | Donors must be able to pre-book time slots for scheduled donation camps to manage crowd flow. | Medium |
| **FR-09** | Inventory Tracking | The system must track real-time blood unit inventory levels, component types, and expiration dates. | High |
| **FR-10** | Screening | Donors must complete a digital health screening questionnaire prior to camp check-in. | Medium |
| **FR-11** | Audit Trail | The system must maintain an end-to-end audit trail of emergency requests from submission to delivery handover. | Low |

---

## 2. Non-Functional Requirements

| Requirement ID | Category | Description | Measurement / Criterion |
| :--- | :--- | :--- | :--- |
| **NFR-01** | Performance | Emergency alert broadcasts to matching donors within a 10km radius must be triggered swiftly. | Notification dispatched in < 3 seconds |
| **NFR-02** | Security | Personal health information (PHI) and donor medical data must be encrypted at rest and in transit. | AES-256 at rest, HTTPS/TLS 1.3 in transit |
| **NFR-03** | Uptime | High availability during emergency blood dispatch workflows. | 99.9% availability during core hours |
| **NFR-04** | Scalability | Backend must handle concurrent bursts during regional emergency broadcasts. | Up to 500 concurrent active donor responses |
| **NFR-05** | Usability | Responsive web interface for desktop and mobile devices. | Emergency alert acceptance in < 3 taps |
