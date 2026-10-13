# PropHunta AI — Deep Audit of Admin Architecture and Multi-Level Staff Access

Act as a senior product architect, application security engineer, and full-stack developer.

Repository: https://github.com/Ayoola1o/RESA

I want to evolve the existing Admin section into a secure, multi-level administrative workspace for PropHunta AI. Different staff members must be able to carry out specific duties without receiving unrestricted administrator privileges.

This task begins with a deep assessment of the existing implementation. Do not immediately redesign the Admin UI or replace the current role system.

## Phase 1: Map the Current Admin System

Inspect the latest repository and document the actual implementation of:

- Admin dashboard and navigation.
- Verification queue and property-document review.
- Property moderation and listing suspension/restoration.
- User management and account suspension.
- Inspection oversight.
- Trust and Safety reports.
- Audit logs.
- Admin-related server actions, API endpoints, database models, and authorization checks.
- Authentication/session handling and role resolution.
- Existing user and role types.

Start with `src/app/(app)/admin/page.tsx`, `src/components/app-sidebar.tsx`, `src/types/prophunta.ts`, and the relevant server-action, service, database, and authentication files. Discover additional paths from the actual codebase.

For each capability, document:
1. What the UI supports.
2. What the server actually implements.
3. Which database records are involved.
4. Which roles can currently access it.
5. Which server-side authorization checks exist.
6. Any security gaps, incomplete workflows, hardcoded values, or missing tests.

Do not infer that a feature is secure merely because its UI exists.

## Phase 2: Propose a Separate Admin Staff Authorization Model

Preserve the existing platform roles:
- SEEKER
- OWNER
- AGENT
- ADMIN

Do not repurpose the existing `UserRole` enum to represent every staff job function.

Design a separate administrative authorization model that supports staff roles such as:
- SUPER_ADMIN
- VERIFICATION_OFFICER
- PROPERTY_MODERATOR
- TRUST_SAFETY_INVESTIGATOR
- INSPECTION_COORDINATOR
- USER_SUPPORT_OFFICER
- COMPLIANCE_AUDITOR

Treat these as proposed staff functions that require approval, not automatically enabled roles.

Define permissions independently of display labels. Examples:
- `admin.dashboard.view`
- `admin.staff.view`
- `admin.staff.invite`
- `admin.staff.update_role`
- `admin.staff.deactivate`
- `verification.queue.view`
- `verification.review`
- `verification.approve`
- `verification.reject`
- `documents.view`
- `documents.review`
- `properties.moderate`
- `properties.suspend`
- `properties.restore`
- `reports.view`
- `reports.investigate`
- `reports.resolve`
- `inspections.view`
- `inspections.update`
- `audit_logs.view`
- `audit_logs.export`
- `users.view_limited`
- `users.suspend`
- `platform.settings.manage`

Refine this list against the actual features in the repository. Do not create unused permissions simply to make the list longer.

Recommend a least-privilege mapping between staff functions and permissions. Identify sensitive actions that should require stronger authorization, justification, or a second-person review.

## Phase 3: Define Role and Data Boundaries

Design a permission matrix showing which staff functions may:
- View records.
- Review or edit records.
- Approve or reject verification.
- Suspend or restore listings.
- Investigate reports.
- Manage inspections.
- View audit logs.
- View limited user-account information.
- Invite, deactivate, or change staff permissions.
- Access platform-wide settings.

Apply record-level restrictions where relevant. For example, an investigator assigned to a case should not automatically receive unrestricted access to all private documents or user conversations.

A normal staff member must not be able to:
- Grant themselves a higher permission level.
- Create another Super Admin.
- Change their own staff role.
- Bypass approval workflows.
- Access private identity documents without a legitimate permission.
- Alter or delete audit records to conceal their actions.

Define how emergency administrator access and recovery should work without introducing a universal bypass.

## Phase 4: Inspect the Current Admin Dashboard UX

Assess the current Admin UI for:
- Existing tabs and navigation.
- Staff management capability or its absence.
- Confusing administrator labels.
- Unnecessary access to sensitive data.
- Missing empty, loading, error, and unauthorized states.
- Duplicate navigation items.
- Hardcoded names, statistics, badge counts, or sample content.
- Actions that lack confirmation, justification, or feedback.

Recommend a clean Admin structure that can show different navigation and dashboards according to each staff member's authorized permissions.

Do not build a new UI before documenting the current implementation and proposing the target architecture.

## Phase 5: Security and Audit Requirements

All administrative permissions must be enforced on the server.

- Never trust a role or permission supplied by the client.
- Resolve staff identity and permissions from a trusted authenticated session and server-side records.
- Deny access by default if authorization cannot be established.
- Validate permissions in every sensitive server action, API endpoint, and data-access path.
- Record who performed sensitive administrative actions, what changed, when it occurred, and whether it succeeded.
- Protect audit records against unauthorized modification and deletion.
- Avoid recording passwords, tokens, or unnecessary sensitive personal information in logs.
- Apply existing authentication and ownership checks in addition to staff permissions.
- Consider session revocation when a staff account is deactivated or its permissions are reduced.

Identify the appropriate database schema changes and migration strategy before implementing them.

## Phase 6: Implementation Plan

Return a phased implementation plan that covers:

1. Current architecture and findings.
2. Recommended admin staff roles and permission matrix.
3. Required database and type changes.
4. Server-side authorization service or policy layer.
5. Staff-management workflows.
6. Permission-aware Admin navigation and UI.
7. Audit logging.
8. Tests, migration, deployment, and rollback strategy.

Separate confirmed current functionality from proposed future functionality.

Do not silently change existing production account roles, assign all existing administrators unrestricted access, or create new privileged accounts.

## Phase 7: Report

Provide:
- A feature-by-feature map of the current Admin implementation.
- Existing server-side authorization findings.
- Current gaps and risks.
- The proposed staff-role and permission matrix.
- Exact files and services that would need modification.
- A prioritized implementation roadmap.
- Tests required to validate each phase.

For this initial task, perform the deep audit and return the findings and implementation plan before undertaking a large architectural rewrite. Do not claim a vulnerability or a feature exists without supporting code evidence.