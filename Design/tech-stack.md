# Project Tech Stack & Architecture Decision

## Selected Stack
* **Frontend:** React (Vite) + Tailwind CSS
* **Backend:** Node.js (Express.js)
* **Database:** PostgreSQL (Hosted via Supabase free tier / Local PostgreSQL)
* **Version Control:** Git & GitHub

## Decision Rationale
1. **Relational Integrity:** PostgreSQL is chosen over NoSQL because our blood coordination system relies heavily on strict relational mappings (foreign keys linking Donors, Camps, and Hospital Requests).
2. **Zero Cost (Free-Tier):** Supabase provides a free-tier PostgreSQL instance, and Render/Vercel offer free deployment tiers for Node and React.
3. **Developer Synergy:** Both team members can run the full stack locally using Node.js and a shared PostgreSQL connection string.
