# Presentation, Demo Rehearsal & Viva Preparation - Bloodbound (Task 43)

## 1. Overview & Objectives
This document outlines the structure of the final project presentation, live demonstration workflow, and key technical/conceptual viva questions to ensure a confident and cohesive team defense.

---

## 2. Presentation Structure & Slide Outline
* **Slide 1-2:** Project Introduction, Problem Statement, and Core Vision of Bloodbound.
* **Slide 3-4:** System Architecture, Database ERD, and Technology Stack.
* **Slide 5-6:** Core Modules Demo (Donor Privacy Masking, Camp Management, Emergency Requests, Attendance Tracking).
* **Slide 7-8:** Testing Results, Security Measures, and Individual Contributions.
* **Slide 9-10:** Conclusion, Future Enhancements, and Q&A Session.

---

## 3. Live Demo Rehearsal Checklist
1. **Donor Flow:** Register a new user, check eligibility status, and simulate an emergency broadcast with phone number masking.
2. **Privacy Acceptance:** Accept an emergency request to verify real-time unmasking of contact details.
3. **Camp & Attendance:** Create a sample donation drive, pre-book a slot, and record live attendance/collection.
4. **Outreach:** Trigger a WhatsApp share link directly from an active request.

---

## 4. Key Viva Questions & Concepts

| Topic / Area | Potential Question | Key Talking Point / Answer |
| :--- | :--- | :--- |
| **Privacy & Security** | How is donor phone number privacy maintained during emergencies? | Numbers are masked (`****`) by default and only unmasked upon explicit acceptance by the donor. |
| **Database Design** | How are donor eligibility rules enforced? | The system calculates the next eligible date automatically (+90 days) using the timestamp from `attendance-recording`. |
| **Tech Stack** | Why was Markdown and Mermaid used for SRS documentation? | To maintain clean version control, clear traceability, and easy PDF compilation for submission. |
