# RESA / PropHunta AI — Profile Verification, Secure Document Management & Production Readiness

## Objective

Audit and improve the existing RESA / PropHunta AI codebase, focusing on the Seeker profile, identity verification, document vault, saved-property statistics, and production build quality.

The current profile UI contains hard-coded verification statuses, sample documents, simulated uploads, placeholder user details, and misleading success notifications. Replace these simulations with genuine, secure workflows wherever the existing backend supports them.

**Important constraints**
- Work within the existing Next.js 15, React 19, TypeScript, Tailwind, and current application architecture.
- Preserve the existing design system, navigation, authentication, and user experience wherever possible.
- Support all existing roles: SEEKER, OWNER, AGENT, and ADMIN.
- Do not invent integrations, credentials, completed verification results, or backend capabilities.
- Do not use Apify or add any scraping functionality.
- Do not replace real data with mock data to make the interface appear functional.
- Inspect the existing implementation before editing files.

## Phase 1 — Audit the existing implementation

Inspect at least:
- `src/app/(app)/profile/page.tsx`
- `src/app/(app)/verification/page.tsx`
- `src/server/actions/prophunta-actions.ts`
- Authentication and user-role services
- Property, verification, and document data models and repositories
- Existing upload/storage infrastructure
- `src/app/(app)/saved/page.tsx`
- `next.config.ts`
- `package.json` and existing tests

Trace each UI action to its server action, persistence layer, and authorization checks.

Identify which features already have genuine backend support and which are currently simulated. Do not assume a backend integration exists merely because the UI displays a success message.

## Phase 2 — Fix verification status integrity

Remove hard-coded verified states, including sample documents initialized as `VERIFIED`, fabricated verification checksums, and unsupported claims of completed NIN/BVN verification, LASRERA compliance, or escrow protection.

Requirements:
1. Load verification status from authenticated, persisted server-side records.
2. Use explicit states such as `NOT_STARTED`, `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, and `ACTION_REQUIRED`, adapting to the existing model where possible.
3. Only an authorized verification workflow may transition a record to `VERIFIED`.
4. Never treat a successful upload, client-side state update, timeout, or toast notification as proof of verification.
5. Display the verification method, verification date, and reviewing authority only when supported by actual records.
6. Show honest empty states and pending statuses when verification has not occurred.
7. Enforce role-based access and resource ownership on the server for all verification actions.
8. Prevent users from modifying their own verification results through client requests.

Do not integrate a government identity provider or claim official registry access unless a real, authorized integration already exists.

## Phase 3 — Implement genuine document management

Replace the simulated `handleUploadDocument()` implementation and fake View/Download actions.

Implement the following where supported by the existing infrastructure:

- Validate file type, file size, and upload permissions on the server.
- Support only approved formats, such as PDF, JPG, and PNG, with appropriate content validation.
- Upload files to private storage; do not expose identity documents through public URLs.
- Persist document metadata, ownership, storage references, timestamps, and verification status.
- Authenticate and authorize every upload, preview, download, and deletion request.
- Use short-lived signed URLs or an authenticated streaming endpoint for secure file access.
- Prevent users from accessing other users' documents by changing document IDs or request parameters.
- Record relevant document and verification actions in the existing audit system.
- Handle upload failures, rejected files, expired links, and network errors clearly.
- Never log sensitive document contents or unnecessary personal information.

If private storage or a verification service is not configured, show a clear unavailable/configuration-required state. Do not pretend the feature succeeded.

Do not store uploaded documents as base64 strings in localStorage or browser state.

## Phase 4 — Remove fabricated profile information

Remove hard-coded fallbacks such as sample names, email addresses, phone numbers, seeker IDs, membership dates, and fabricated identity statuses.

Requirements:
- Load profile details from the authenticated user record.
- Display a suitable empty state when a field is missing.
- Ensure the displayed role matches the authoritative server-side role.
- Persist profile changes through authorized server actions where editing is supported.
- Make the copy-ID action use the actual user identifier and handle clipboard errors.
- Load housing preferences from persisted user-specific data.
- Keep user preferences isolated between accounts.
- Ensure localStorage is never treated as the authoritative source for authentication, permissions, or verification status.

## Phase 5 — Correct saved-property statistics

Remove default saved-property counts such as `2` when there is no corresponding saved-property record.

Requirements:
- Derive saved-property counts from the actual saved-property data source.
- Display zero when the user has no saved properties.
- Handle missing, malformed, or inaccessible saved-property data without inventing records.
- Keep the profile summary consistent with the Saved Properties page.
- Do not fall back to unrelated property listings when a user's saved list is empty.

## Phase 6 — Production build and code quality

Inspect `next.config.ts`, which currently sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to `true`.

1. Identify and fix existing TypeScript and lint issues.
2. Remove these bypasses when the project can pass the corresponding checks.
3. If unrelated legacy issues prevent immediate removal, document each blocker and address them rather than silently suppressing failures.
4. Review `package.json` scripts and update them if necessary for the installed Next.js version. Do not assume a script is valid without running it.
5. Run:
   - TypeScript typecheck
   - ESLint using the project's supported configuration
   - Production build
   - Relevant unit and integration tests
6. Fix regressions caused by your changes.
7. Do not report a check as passing unless it actually ran and passed.

## Phase 7 — Testing and acceptance criteria

Test the following cases:

- New user with no verification records.
- Pending, approved, rejected, and action-required verification.
- Valid and invalid document uploads.
- Oversized and unsupported files.
- Upload and storage failures.
- Authorized and unauthorized document preview/download.
- Attempts to access another user's document.
- Missing profile fields and unauthenticated requests.
- Switching between SEEKER, OWNER, AGENT, and ADMIN accounts.
- Empty and populated saved-property lists.
- Existing profile navigation, tabs, preferences, and responsive layouts.
- Build, lint, and TypeScript checks.

Confirm that the interface never presents unverified documents or unimplemented protections as verified.

## Implementation deliverables

After implementation, report:

1. Root causes found.
2. Files changed and the purpose of each change.
3. Backend workflows implemented versus features still awaiting external configuration.
4. Database or schema migrations required.
5. Environment variables and storage configuration required, without exposing secrets.
6. Security controls added.
7. Commands executed and their actual results.
8. Remaining blockers and recommended next steps.

Implement the changes in the existing repository. Do not stop after producing an audit report, but do not fabricate missing infrastructure to force the acceptance criteria to appear complete.