# PropHunta AI

> **Building the verified trust infrastructure for property.**  
> *Verified property. Smarter decisions.*

PropHunta AI is the trust infrastructure platform for real estate, designed to eliminate fraud, fake listings, phantom titles, and opaque hidden fees in Nigerian property transactions.

---

## The Core Product Journey

$$\text{Find} \longrightarrow \text{Verify} \longrightarrow \text{Inspect} \longrightarrow \text{Agree} \longrightarrow \text{Pay} \longrightarrow \text{Handover} \longrightarrow \text{Manage}$$

1. **Find**: Search verified residential and commercial properties in Lagos, Abuja, and other growth corridors.
2. **Verify**: Every listing undergoes granular title, ownership, location, and condition audits before earning the **PropHunta Verified Trust Shield**.
3. **Inspect**: Schedule physical or virtual on-site walkthroughs with verified owners or licensed agents.
4. **Agree**: Submit transparent expressions of interest / applications with explicit fee breakdowns (Legal fees, Caution deposits, Service charges).
5. **Pay**: Escrow-backed transparent payment flows with zero surprise charges.
6. **Handover**: Inspection condition scorecards and handover audit trails.
7. **Manage**: Continued tenancy management, maintenance logging, and document retention.

---

## Primary Implemented Roles

- **Property Seeker (`SEEKER`)**: Browse verified listings, request physical/virtual inspections, submit applications/offers, and securely message hosts.
- **Property Owner (`OWNER`)**: Create property drafts, upload title documents (C of O, Governor's Consent, Survey Plan), submit for verification review, manage incoming inspections and offers.
- **Agent / Property Manager (`AGENT`)**: Manage multiple listings with verified agency credentials (LASRERA / estate licenses), schedule inspections, and manage communications.
- **Administrator / Verification Officer (`ADMIN`)**: Audit submitted titles and ownership evidence, approve/reject/request changes on listings, moderate flagged reports, and inspect immutable audit logs.

---

## Architecture & Persistence

PropHunta AI is built on a clean service/repository layer:

$$\text{UI (Client Components / Server Components)} \longrightarrow \text{Server Actions} \longrightarrow \text{Domain Services} \longrightarrow \text{Repositories} \longrightarrow \text{Durable Store}$$

- **Persistence**: Durable local store in `.data/prophunta-db.json` with memory caching and atomic writes.
- **Auth & Session**: HTTP-only session cookies with role verification enforced on the server.
- **Audit Logging**: Sensitive actions (document uploads, status updates, review approvals, reports) are recorded in an immutable audit ledger.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run type check
npm run typecheck

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view PropHunta AI.

### Demo Seed Accounts

All accounts share the default password: `Password123!`

- **Seeker**: `seeker@prophunta.ai` (Chidi Okonkwo)
- **Owner**: `owner@prophunta.ai` (Alhaji Ibrahim Danjuma)
- **Agent**: `agent@prophunta.ai` (Tunde Adeleke)
- **Admin**: `admin@prophunta.ai` (Amina Bello)
