\# Architecture and Design Decisions - Bloodbound



\## 1. System Architecture Pattern

Bloodbound adopts a \*\*3-Tier Layered Architecture\*\* to ensure clean separation of concerns, maintainability, and scalability:

\* \*\*Presentation Layer (Client):\*\* Single Page Application (SPA) built with React and Vite.

\* \*\*Application / Business Logic Layer (Server):\*\* RESTful API built with Node.js and Express.js, handling routing, authentication middleware, and business rules.

\* \*\*Data Persistence Layer (Database):\*\* Relational PostgreSQL database managed via structured SQL schemas.



\---



\## 2. Technology Stack Selection \& Justification

\* \*\*React + Vite (Frontend):\*\* Chosen for its lightning-fast bundling, modular component-based structure, and minimal configuration overhead, allowing rapid UI prototyping without heavy build bloat.

\* \*\*Node.js \& Express (Backend):\*\* Selected for its lightweight footprint, asynchronous event-driven model, and seamless JSON data exchange with the React frontend.

\* \*\*PostgreSQL (Database):\*\* Chosen over NoSQL to enforce strict relational integrity across users, hospital requests, blood inventory, and donation camps using foreign keys, constraints, and ACID compliance.



\---



\## 3. Role-Based Access Control (RBAC)

Bloodbound strictly isolates features across \*\*four distinct user roles\*\*:

1\. \*\*Donor:\*\* Can view personal profile, check eligibility, book camp slots, and respond to matching alerts.

2\. \*\*Hospital Staff:\*\* Can create and monitor urgent blood requests and track inventory allocation.

3\. \*\*Camp Organizer:\*\* Can schedule, manage, and coordinate blood donation camps and track target units.

4\. \*\*Admin:\*\* Oversees system moderation, user verification, and overall platform data.



\* \*\*Implementation Decision:\*\* Authentication is secured using \*\*JSON Web Tokens (JWT)\*\* and passwords are encrypted using \*\*bcryptjs\*\* hashing. Custom Express middleware (`authorizeRoles`) validates tokens and restricts route access based on role permissions.



\---



\## 4. Emergency Blood Matching Rules

To fulfill urgent hospital requests efficiently:

\* \*\*Compatibility Filtering:\*\* System matches requests against donor blood groups using strict medical compatibility rules (e.g., O- universal donor, matching component types like Packed RBCs or Platelets).

\* \*\*Proximity \& Eligibility:\*\* Active matching filters donors within the same city or coordinate radius who meet current health eligibility windows.



\---



\## 5. Privacy of Contact Details

\* \*\*Policy:\*\* Donor personal contact numbers and emails remain strictly \*\*hidden\*\* from requesters during initial broadcast and matching phases.

\* \*\*Rationale:\*\* Contact information is only revealed once a donor explicitly accepts an emergency match or confirms a slot booking, preventing spam, harassment, and protecting donor data privacy.



\---



\## 6. Configurable Eligibility Rules

\* \*\*Logic:\*\* Donors must satisfy a minimum time gap between donations (e.g., 56 days for whole blood) and pass health criteria.

\* \*\*Design Choice:\*\* Eligibility parameters are centralized in backend logic and database flags (`is\_eligible`, `last\_donation\_date`), making rules easily configurable for system administrators without altering core database tables.

