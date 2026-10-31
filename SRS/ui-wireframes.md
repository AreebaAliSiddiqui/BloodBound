# UI Wireframes & Layout Guidelines - Bloodbound

## 1. Design Principles & Navigation Structure
The Bloodbound user interface follows a clean, accessible, and high-contrast design system optimized for urgent emergency actions and smooth camp bookings.
* **Primary Color Palette:** Crimson Red (#DC2626) for emergency accents, Clean White background, and Slate Gray text for readability.
* **Bottom Navigation Bar (Mobile View):** Home, Search/Camps, Emergency Alerts, Profile.

---

## 2. Core Screen Wireframes

### Screen 1: Donor Dashboard (Home)
```text
+---------------------------------------------------+
|  [≡] Bloodbound                    [Notification] |
+---------------------------------------------------+
|  Welcome back, Rani!                              |
|  Status: Eligible to Donate (Last: 3 months ago)  |
+---------------------------------------------------+
|  [ EMERGENCY ALERT BANNER ]                       |
|  O-Negative needed urgently near City Hospital!   |
|  [ Tap to View & Accept ]                         |
+---------------------------------------------------+
|  Quick Actions:                                   |
|  [ Find Donation Camps ]   [ My Digital Passes ]  |
+---------------------------------------------------+
|  Upcoming Camp Bookings:                          |
|  - City Center Blood Camp (Nov 15, 10:00 AM)      |
+---------------------------------------------------+
```

### Screen 2: Emergency Request Submission (Hospital Staff View)
```text
+---------------------------------------------------+
|  <  Create Emergency Request                      |
+---------------------------------------------------+
|  Blood Group Required:                            |
|  [ Select Blood Group v ] (e.g., O-)              |
|                                                   |
|  Units Needed:                                    |
|  [ Enter Number of Units ] (e.g., 2)              |
|                                                   |
|  Urgency Level:                                   |
|  ( ) Normal   (•) Critical / Immediate            |
|                                                   |
|  Hospital / Location:                             |
|  [ City General Hospital, Block-4 ]               |
|                                                   |
|         [ Broadcast Emergency Alert Now ]         |
+---------------------------------------------------+
```

### Screen 3: Donation Camp Slot Booking (Donor View)
```text
+---------------------------------------------------+
|  <  Select Camp Slot                              |
+---------------------------------------------------+
|  Camp: Central Community Hall Blood Drive         |
|  Date: November 15, 2026                          |
+---------------------------------------------------+
|  Available Time Slots:                            |
|  [  09:00 AM - 10:00 AM (Available)  ]            |
|  [  10:00 AM - 11:00 AM (5 slots left) ]          |
|  [  11:00 AM - 12:00 PM (FULL)         ] (Disabled)|
+---------------------------------------------------+
|             [ Confirm & Book Slot ]               |
+---------------------------------------------------+
```
