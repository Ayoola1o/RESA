# PropHunta AI — Admin Governance, RBAC, Delegation & Approval Architecture

## Objective

Perform a deep technical audit and phased redesign of the existing PropHunta AI Admin system. Evolve it into a secure, maintainable administrative governance system with predefined staff roles, controlled custom permissions, delegated staff management, and independent approval for high-impact actions.

**Repository:** https://github.com/Ayoola1o/RESA

Work with the existing codebase, conventions, authentication system, database and UI architecture. Do not assume that proposed features already exist. Verify everything against actual source code.

## Mandatory product decisions

1. Use a hybrid permission model: predefined staff roles plus controlled custom permissions.
2. Super Admin retains ultimate administrative authority.
3. Staff Managers may manage staff only when explicitly delegated that authority, with strict limits on which roles, permissions and scopes they can assign.
4. High-impact actions require independent approval before execution.
5. A requester must not approve their own request.
6. Platform user roles remain SEEKER, OWNER, AGENT and ADMIN. Do not overload this existing enum with operational staff job titles unless repository evidence proves a separate design is necessary. Prefer a dedicated staff authorisation model.
7. The Admin UI is not a security boundary. All permissions must be enforced on the server.
8. Follow least privilege and default-deny principles.
9. Preserve existing working Admin workflows and public-facing user functionality.
10. Do not claim tests, deployments or changes succeeded unless they were actually executed and verified.

## Stage 1 — Audit before implementation

Inspect:

- All Admin pages, layouts, navigation and shared components.
- Authentication, session handling, middleware and role resolution.
- Every Admin API route, server action and mutation.
- Database/ORM schema and migrations.
- Existing verification, property moderation, user management, inspections, trust-and-safety reports and audit-log workflows.
- Existing tests and CI configuration.
- Current permissions, staff-management features and approval mechanisms, if any.

Produce an inventory of every administrative operation, its data/resource scope, current server-side authorisation and identified gaps.

Identify any fallback role behaviour, client-controlled privilege assumptions, IDOR/BOLA vulnerabilities, sensitive-document exposure, missing audit records, unsafe direct mutations, and ways a staff member could elevate their privileges.

Do not infer functionality from sidebar labels or UI buttons alone.

## Stage 2 — Define the authorisation model

Propose and document a central permission catalogue with stable identifiers, including:

- admin.dashboard.view
- admin.staff.view
- admin.staff.invite
- admin.staff.update_role
- admin.staff.deactivate
- verification.queue.view
- verification.review
- verification.approve
- verification.reject
- documents.view_metadata
- documents.view_sensitive
- documents.review
- properties.moderate
- properties.suspend
- properties.restore
- reports.view
- reports.investigate
- reports.resolve
- reports.escalate
- inspections.view
- inspections.assign
- inspections.update
- users.view_limited
- users.support
- users.suspend
- audit_logs.view
- audit_logs.export
- approvals.view_assigned
- approvals.approve
- approvals.reject
- platform.settings.view
- platform.settings.manage

Adjust this catalogue to actual product features. Do not create dead permissions or grant broad access merely to make the UI work.

Define these predefined roles:

- Super Admin
- Verification Officer
- Property Moderation Officer
- Trust & Safety Investigator
- Inspection Coordinator
- User Support Officer
- Compliance & Audit Officer
- Staff Manager as a delegated management capability, not an automatic superuser

Document the role-permission matrix and data scopes. Multiple operational roles may be assigned when justified.

Custom permissions must include a reason, grantor, scope, status and expiry/review policy. Prevent self-grants, privilege escalation, unrestricted Super Admin-equivalent custom grants, and delegation beyond the grantor's authority.

## Stage 3 — Implement central server-side enforcement

Create or adapt central authorisation services following the repository's conventions.

Requirements:

- Check authenticated identity and active staff status.
- Resolve effective permissions from roles, approved custom grants and scope.
- Enforce resource-level access, not just page-level access.
- Apply authorisation to every protected query and mutation.
- Fail closed for missing, invalid, expired or revoked authorisation.
- Never trust role or permission values supplied by the browser.
- Avoid scattered, inconsistent role comparisons.
- Revalidate authorisation at the point of sensitive execution.
- Revoke or refresh sessions and cached permissions after deactivation or material privilege changes.
- Ensure normal platform users cannot access Admin APIs simply by changing client state or URLs.

## Stage 4 — Implement staff management and delegation

Add or adapt a Staff & Access Management workflow supporting:

- Staff directory and account status.
- Invitation and onboarding.
- Predefined role assignment.
- Custom permission grants, expiry and review.
- Explicit Staff Manager delegation and delegation limits.
- Suspension, deactivation and revocation.
- Audit history and effective-permission preview.

Only Super Admins and staff with the appropriate explicit delegation may manage staff.

A Staff Manager must not grant permissions beyond their delegation ceiling, promote themselves, alter their own security boundary, create Super Admins or bypass protected-role rules.

Use the existing identity system where possible; do not introduce a duplicate authentication system.

## Stage 5 — Implement high-impact action approval

Create a policy-driven approval workflow for designated high-impact operations, including privileged staff changes, selected property/user restrictions, global security-setting changes and other consequential operations identified during the audit.

Requirements:

- Requester, exact target resource, proposed change, reason and supporting evidence.
- Independent eligible approver; requester cannot approve their own request.
- Explicit pending, approved, rejected, expired and cancelled states.
- Approval bound to the exact proposed change.
- Reject execution if the target state or proposed change has materially changed since approval.
- Revalidate permissions and current resource state before execution.
- Execute approved actions atomically where supported.
- Prevent duplicate execution and unsafe retries.
- Audit the request, decision and execution outcome.
- Define a narrowly scoped emergency procedure with explicit safeguards and logging.

Routine low-risk operations should not be unnecessarily blocked by the approval system.

## Stage 6 — Audit logging and sensitive data

Record security-relevant administrative events with actor, action, target, outcome, timestamp, request/correlation ID and safe before/after metadata where appropriate.

Protect audit records against ordinary staff modification or deletion. Avoid logging passwords, authentication tokens or full sensitive identity-document contents.

Apply explicit permissions to sensitive documents and exports, and record access where appropriate.

## Stage 7 — Integrate the existing Admin workflows

Preserve and correctly protect the existing workflows discovered in the repository, including:

- Platform Overview.
- Verification Queue.
- Property Moderation.
- Trust & Safety Reports.
- Inspection Oversight.
- User Support.
- Staff & Access Management.
- Approval Queue.
- System Audit Logs.
- Platform Settings, if supported.

Generate sidebar visibility and action availability from effective permissions, but independently enforce all access on the server.

Provide understandable empty states, access-denied responses and loading/error handling. Maintain responsive layouts and existing visual conventions.

## Stage 8 — Security and regression testing

Write automated tests for:

- Every permission and protected operation.
- Unauthenticated and non-staff access.
- Each predefined staff role and its denied actions.
- Cross-account and cross-resource isolation.
- Direct API calls that bypass the UI.
- Client-side role/permission manipulation.
- Custom grants, scope restrictions, expiry and revocation.
- Delegation ceilings and attempted self-promotion.
- Staff deactivation and session invalidation.
- Approval separation of duties.
- Changed or expired approval requests.
- Duplicate execution and retry handling.
- Audit event creation.
- Existing Admin workflows and public user-role behaviour.

Use isolated test accounts and staging/test data. Do not run destructive penetration tests against production.

## Stage 9 — Delivery process

Before major implementation, provide:

1. Repository findings with file paths and relevant symbols.
2. Existing workflow inventory.
3. Security gaps ranked by severity.
4. Proposed role-permission matrix.
5. Proposed data-model changes and migration strategy.
6. Implementation phases and dependencies.
7. Tests required for each phase.

Then implement incrementally in small, reviewable changes. Do not replace the whole Admin page or introduce a new framework without evidence that it is necessary.

After each phase, run the available lint, type-check, test and build commands. Report the actual command and outcome. If a check cannot run, explain why.

## Definition of done

- All protected Admin operations have verified server-side authorisation.
- Staff roles and custom grants follow least privilege.
- Delegated staff management cannot exceed its defined authority.
- High-impact actions require independent approval.
- Revoked privileges cannot continue to authorise new protected operations.
- Audit records capture sensitive administrative decisions without exposing secrets.
- Existing user roles and legitimate product workflows remain functional.
- Security and regression tests provide evidence for the implemented behaviour.
- All incomplete items, migration risks and deployment requirements are documented.

**Start with the audit and implementation plan. Do not perform a sweeping rewrite before presenting the findings and proposed changes.**