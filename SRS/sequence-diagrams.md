# Sequence Diagrams - Bloodbound

## 1. Emergency Blood Request & Donor Matching Sequence
This sequence illustrates the interaction between Hospital Staff, the System, and Donors during an emergency blood request.

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Hospital Staff
    participant System as Bloodbound System
    actor Donor as Active Donor

    Staff->>System: Submit Emergency Request (Blood Group, Units, Location)
    System->>System: Validate Request & Query Matching Engine
    System->>Donor: Broadcast Emergency Alert (Push / SMS)
    Donor->>System: Open App & Tap "Accept Request"
    System->>System: Generate Digital Transit Pass
    System->>Staff: Update Dashboard (Donor Confirmed)
    System->>Donor: Display Transit Pass Details
```

---

## 2. Donation Camp Slot Pre-Booking Sequence
This sequence illustrates how a Donor browses and books a time slot for a donation camp.

```mermaid
sequenceDiagram
    autonumber
    actor Donor as Donor
    participant System as Bloodbound System
    participant Organizer as Camp Organizer

    Organizer->>System: Publish Camp Event & Set Slot Limits
    Donor->>System: Browse Available Donation Camps
    System->>Donor: Display Camps & Time Slots
    Donor->>System: Select Camp & Choose Time Slot
    System->>System: Check Slot Capacity Availability
    alt Capacity Available
        System->>Donor: Confirm Booking & Send QR Pass
        System->>Organizer: Update Camp Registration Count
    else Slot Full
        System->>Donor: Show "Slot Full" Error & Prompt Alternative
    end
```
