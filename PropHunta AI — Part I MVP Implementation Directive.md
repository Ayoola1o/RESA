# PROPHUNTA AI — PART I MVP IMPLEMENTATION

## PRODUCT TRANSITION

The existing application was previously called RESA.

It is now being transformed into:

**PropHunta AI**

Product positioning:

**Building the verified trust infrastructure for property.**

The uploaded PropHunta AI PRD is the source of truth for this implementation.

Do NOT continue treating the application as a generic real-estate marketplace.

The MVP must support the core journey:

**Find → Verify → Inspect → Agree → Pay → Handover → Manage**

For this MVP, the primary implemented roles are:

1. Property Seeker
2. Property Owner
3. Agent / Property Manager
4. Administrator / Verification Officer

The existing Tenant/Landlord UI can be reused where appropriate, but the architecture and UI terminology must be updated to the new PropHunta AI role model.

---

# 1. IMPLEMENTATION PRINCIPLE

Do not throw away the existing frontend.

First inspect the current codebase and preserve useful components, layouts, shadcn/ui components, responsive behavior and existing property UI.

However:

DO NOT build additional functionality on top of the existing mock-data-only architecture.

The existing mock data may remain temporarily for seed/demo data, but every P0 workflow must be designed around real persistence and a clear service/API boundary.

Do not create fake successful operations that only update React state or localStorage.

---

# 2. BRAND TRANSFORMATION

Replace RESA branding throughout the user-facing application with:

**PropHunta AI**

Use the product positioning:

**Verified property. Smarter decisions.**

or an equivalent approved brand line where appropriate.

Update:

- page titles
- metadata
- navigation
- sidebar
- headers
- authentication screens
- dashboard branding
- empty states
- notifications
- emails/messages if present
- README references
- documentation references

Do not leave visible RESA branding in production UI.

---

# 3. ROLE ARCHITECTURE

Implement role-aware application behavior.

Roles:

```text
SEEKER
OWNER
AGENT
ADMIN
```

Permissions must NOT be implemented merely through frontend conditional rendering.

The backend/service layer must enforce authorization.

Example:

SEEKER:
- search properties
- view properties
- request inspection
- send enquiry
- submit application/expression of interest
- report listing
- manage profile

OWNER:
- create property
- edit property
- submit listing
- upload documents/media
- respond to inspection requests
- respond to enquiries
- manage availability

AGENT:
- create/manage authorized listings
- upload supporting authority
- respond to enquiries
- manage inspection requests
- manage assigned property relationships

ADMIN:
- manage users
- review properties
- review verification
- investigate reports
- approve/reject/request changes
- suspend/restore listings
- inspect audit logs
- oversee inspections

---

# 4. AUTHENTICATION

Replace demo login behavior with real authentication.

Required:

- registration
- login
- logout
- password reset
- session persistence
- role selection/onboarding
- protected routes
- authorization checks

Never treat localStorage as the security boundary.

Client-side role state may be used for UI presentation, but server-side authorization must determine whether an operation is permitted.

Handle:

- invalid credentials
- expired session
- unauthorized access
- forbidden access
- loading state
- account verification state

---

# 5. USER PROFILE MODEL

Create a real user/profile model.

Minimum information:

```text
id
name
email
phone
role
profilePhoto
location
verificationStatus
createdAt
updatedAt
```

Professional profiles should support:

```text
professionalType
agency/company
license/registration information where applicable
bio
contact information
verification status
```

Do not claim a user is verified unless the relevant verification workflow supports that claim.

---

# 6. PROPERTY DATA MODEL

Replace the current shallow mock property architecture with a proper persistent property model.

Minimum fields:

```text
id
ownerId
authorizedAgentId
title
propertyType
listingType
description

state
city
area
address
latitude
longitude

price
agreementFee
cautionFee
serviceCharge
otherCharges

bedrooms
bathrooms
features

availabilityStatus
intendedUse

listingStatus

createdAt
updatedAt
publishedAt
```

Listing status must support:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
VERIFIED
CHANGES_REQUIRED
REJECTED
ACTIVE
RESERVED
OCCUPIED
SOLD
SUSPENDED
```

These statuses must drive the UI and workflow.

---

# 7. PROPERTY MEDIA

Create persistent property media records.

Support:

- images
- video
- ordering
- captions
- upload status
- primary image

Do not rely on hardcoded external image URLs as the final architecture.

Use secure file storage.

---

# 8. PROPERTY DOCUMENTS

Create a property document model.

Documents may include:

- ownership/authority documentation
- survey information
- supporting property documents
- other verification evidence

Minimum fields:

```text
id
propertyId
uploadedBy
documentType
fileReference
status
uploadedAt
reviewedAt
reviewedBy
reviewNotes
```

Documents must not be publicly accessible by default.

Use access-controlled storage.

---

# 9. PROPERTY CREATION FLOW

Redesign the existing Add Property experience into a real workflow.

Recommended steps:

```text
1. Basic Information
2. Location
3. Pricing & Charges
4. Property Details
5. Media
6. Documents
7. Review
8. Submit
```

Allow:

- Save Draft
- Edit Draft
- Submit for Review

Submission changes listing status to:

`SUBMITTED`

Do not automatically mark it VERIFIED.

---

# 10. PROPERTY DISCOVERY

Implement real property discovery against persistent data.

Required:

- search by location
- price filtering
- property type
- bedrooms
- availability
- listing type
- pagination
- sorting

The UI should preserve the polished marketplace design already being developed.

Property cards should visibly communicate:

- price
- location
- type
- key features
- availability
- verification state

Do not display a generic "Verified" badge unless the verification model supports it.

---

# 11. PROPERTY DETAIL PAGE

The Property Detail page is one of the most important PropHunta AI screens.

It must contain:

- title
- location
- price
- availability
- property type
- photos/video
- description
- full cost breakdown
- verification panel
- authorized party
- inspection information
- enquiry CTA
- inspection CTA
- application/expression-of-interest CTA
- report listing

Verification must be granular.

Display separate statuses for:

```text
Owner identity
Property location
Ownership/authority documentation
Availability
Media
Inspection
Last verification
```

Use the language:

**Documentation reviewed**

rather than:

**Ownership guaranteed**

Never make an absolute ownership guarantee.

---

# 12. VERIFICATION SYSTEM

This is the core differentiator of PropHunta AI.

Create a real verification model.

Minimum structure:

```text
verificationId
propertyId
reviewerId

ownerIdentityStatus
locationStatus
authorityDocumentStatus
availabilityStatus
mediaStatus
inspectionStatus

overallStatus

reviewNotes
reviewedAt
lastVerifiedAt
```

Statuses should support appropriate states such as:

```text
PENDING
IN_REVIEW
PASSED
FAILED
CHANGES_REQUIRED
NOT_REVIEWED
```

Build a verification checklist UI.

Admins must be able to:

- review
- approve
- reject
- request changes

The property must never become VERIFIED simply because a document was uploaded.

---

# 13. ADMIN VERIFICATION QUEUE

Create a real admin dashboard.

Minimum sections:

### Overview
- total users
- total properties
- pending verification
- inspections
- reports

### Verification Queue
- property
- owner/agent
- submission date
- verification status
- documents
- action

Actions:

```text
Review
Approve
Reject
Request Changes
```

### Property Moderation

Admins must be able to:

- inspect property
- suspend listing
- restore listing
- review documents
- review reports

### User Management

Admins can:

- inspect user
- view role
- view verification status
- suspend where appropriate

---

# 14. AUDIT LOG

Implement audit logging for sensitive actions.

Record:

```text
actor
action
objectType
objectId
timestamp
result
metadata
```

At minimum log:

- document upload
- verification approval
- verification rejection
- listing submission
- listing edit
- listing suspension
- listing restoration
- inspection status changes
- report creation
- report resolution

Audit records must be immutable from normal application workflows.

---

# 15. INSPECTION SYSTEM

Implement the inspection workflow.

States:

```text
REQUESTED
ACCEPTED
SCHEDULED
COMPLETED
CANCELLED
RESCHEDULED
NO_SHOW
```

Seeker:

- request inspection
- choose/request preferred time
- see status
- view inspection record

Owner/Agent:

- accept
- reject/cancel where appropriate
- propose schedule
- update status

Inspection record must support:

```text
date
inspector
photos
video
condition
meters
utilities
observations
discrepancies
```

---

# 16. PROPERTY-SPECIFIC ENQUIRIES

Communication must be tied to the property.

Do not build a generic social messaging system.

Every conversation should associate:

```text
user
property
timestamp
message
```

Support:

- seeker → owner/agent
- owner/agent → seeker
- property context
- message history
- notifications

---

# 17. APPLICATION / EXPRESSION OF INTEREST

For rental:

```text
name
contact
occupation
moveInDate
occupants
message
```

For sale:

```text
name
contact
offer
message
financingStatus
```

Do not implement final legal transaction execution in this MVP.

---

# 18. TRUST & SAFETY

Implement:

**Report Listing**

Reasons:

```text
Suspected Scam
Incorrect Information
Unavailable Property
Unauthorized Representation
Duplicate Listing
Misleading Price/Photos
Other
```

Allow additional description.

Admin workflow:

```text
Reported
Under Investigation
Documentation Requested
Resolved
Dismissed
Suspended
Escalated
```

Maintain resolution history in the audit system.

---

# 19. DASHBOARDS

Do not build one generic dashboard.

### SEEKER DASHBOARD

Focus on:

- saved properties
- recent searches
- applications
- inspections
- enquiries
- recommended properties
- recently viewed properties

### OWNER DASHBOARD

Focus on:

- properties
- listing status
- verification status
- inspection requests
- enquiries
- applications
- occupancy/availability

### AGENT DASHBOARD

Focus on:

- managed properties
- submitted listings
- verification queue status
- inspections
- enquiries
- property relationships

### ADMIN DASHBOARD

Focus on:

- platform overview
- pending verification
- properties requiring review
- reports
- inspections
- users
- audit activity

---

# 20. MOBILE-FIRST DESIGN

The PRD explicitly requires a mobile-first responsive application.

Do not simply shrink the desktop UI.

Test:

- 320px+
- 375px
- 390px
- 430px
- tablet
- desktop

Prioritize:

- property search
- property detail
- inspection request
- enquiry
- verification status
- owner listing submission
- admin review

---

# 21. SECURITY

Implement:

- secure password handling
- role-based authorization
- input validation
- server-side validation
- rate limiting where appropriate
- secure file access
- protected documents
- session management
- audit logging
- safe error responses

Never expose sensitive document storage URLs publicly.

---

# 22. AI — DO NOT LET IT BLOCK P0

Existing Genkit/Gemini functionality may remain, but AI is NOT the first implementation priority.

Do not spend the current implementation phase building:

- autonomous fraud verdicts
- AI ownership certification
- automated legal advice
- advanced valuation
- predictive rent pricing
- proprietary foundation-model training

Those are explicitly outside the initial MVP scope.

Once P0 is stable, implement P1 AI capabilities:

1. AI listing assistant
2. document text extraction
3. document/listing inconsistency flags
4. basic natural-language search

All AI outputs require human review where they affect trust or verification.

---

# 23. DATA / MOCK DATA TRANSITION

Existing mock data may remain temporarily for seed/demo purposes.

Create a clean separation:

```text
mock/
seed/
services/
repositories/
api/
```

The UI must not directly import mock data for production workflows.

Avoid patterns like:

```ts
import { properties } from '@/lib/mock-data';
```

inside major production pages.

Instead use a service/repository boundary.

Example:

```text
UI
 ↓
Server Action / API
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

# 24. EXISTING UI PRESERVATION

Keep the current polished UI direction.

Do not unnecessarily rewrite working visual components.

However, update the UI to PropHunta AI terminology and introduce consistent design patterns.

The application should feel like:

**Verified PropTech + Trust Infrastructure + Modern Property Platform**

not a generic admin dashboard.

---

# 25. IMPLEMENTATION ORDER

Implement in this order:

### PHASE 1
Foundation

- rename product
- architecture cleanup
- database foundation
- environment configuration
- service/repository structure

### PHASE 2
Authentication

- registration
- login
- logout
- reset password
- sessions
- role onboarding
- authorization

### PHASE 3
Profiles

- seeker
- owner
- agent
- admin

### PHASE 4
Property

- database model
- create
- edit
- draft
- submit
- media
- documents
- listing statuses

### PHASE 5
Discovery

- search
- filters
- property cards
- detail page
- cost breakdown

### PHASE 6
Verification

- verification model
- document review
- verification checklist
- admin queue
- granular trust display

### PHASE 7
Admin

- users
- properties
- verification
- moderation
- reports
- audit logs

### PHASE 8
Inspection

- request
- scheduling
- status
- inspection records
- evidence

### PHASE 9
Communication

- property enquiries
- conversations
- messages
- notifications

### PHASE 10
Trust & Safety

- report listing
- investigation
- suspension
- restoration
- resolution history

### PHASE 11
Application / Expression of Interest

- rental application
- sale expression of interest

### PHASE 12
QA

Test the complete workflows end-to-end.

---

# 26. REQUIRED END-TO-END MVP TEST

The following scenario must work:

## SEEKER

Register
→ Login
→ Search property
→ Open property
→ Understand cost
→ See granular verification
→ Request inspection
→ Send enquiry
→ Submit application/expression of interest
→ Report suspicious listing

## OWNER

Register
→ Select Owner
→ Create property
→ Save draft
→ Upload media
→ Upload documents
→ Submit
→ Receive verification decision
→ Manage inspection
→ Respond to enquiry

## AGENT

Register
→ Select Agent
→ Create/manage authorized listing
→ Submit supporting information
→ Manage inspection
→ Respond to enquiry

## ADMIN

Login
→ View dashboard
→ Review user/property
→ Open verification queue
→ Review documentation
→ Approve/reject/request changes
→ Investigate report
→ Suspend/restore listing
→ Review audit log

Every workflow must persist data correctly.

---

# 27. DEFINITION OF DONE

Do not mark a feature complete merely because the page renders.

A feature is complete only when:

- UI implemented
- database persistence implemented
- API/service layer implemented
- authorization implemented
- validation implemented
- loading states implemented
- empty states implemented
- error states implemented
- mobile responsive
- tested
- critical bugs fixed

The PRD's launch gate requires all P0 workflows to operate end-to-end, with no critical security issues, working verification operations, real seekers able to search/request inspections, report investigation capability, and no misleading verification claims.

---

# 28. IMPORTANT DEVELOPMENT RULE

Do NOT build everything in one enormous uncontrolled change.

Work incrementally.

After each major phase:

1. inspect existing implementation
2. implement
3. run type checking
4. run lint
5. run tests
6. fix errors
7. verify responsive UI
8. commit
9. continue to next phase

Do not silently skip broken functionality.

Do not replace working components without a reason.

Do not introduce unnecessary dependencies.

Do not fabricate backend success states.

Do not mark properties verified without an actual verification workflow.

---

# FIRST IMPLEMENTATION TARGET

Start immediately with:

**Foundation → Authentication → Roles → Profiles**

Then proceed into:

**Property database → Property creation → Discovery → Property details → Verification**

Do not begin P1 AI work until the P0 foundation is stable.

The final goal of this implementation is a working, mobile-first, role-secured, auditable PropHunta AI MVP that can support a controlled pilot.