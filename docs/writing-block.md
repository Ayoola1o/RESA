# PropHunta AI — Post-Deployment Functional Audit and Bug Fix

Act as a senior full-stack engineer and QA specialist working on my existing PropHunta AI / RESA application.

**Repository:** https://github.com/Ayoola1o/RESA

The latest commits introduced dedicated pages, sidebar navigation fixes, responsive UI improvements, and authentication-based role handling. Before implementing additional features, I want you to verify that these changes work correctly in the actual application and fix any remaining issues.

Do not assume that a successful Vercel deployment means the application is functionally correct.

## Phase 1: Inspect the Latest Code

1. Pull or inspect the latest commit on the active deployment branch.
2. Review the recent changes to:
   - `src/components/app-sidebar.tsx`
   - `src/app/(app)/profile/page.tsx`
   - `src/app/(app)/inspections/page.tsx`
   - `src/app/(app)/applications/page.tsx`
   - `src/app/(app)/saved/page.tsx`
   - `src/app/(app)/verification/page.tsx`
   - The login page, authentication/session implementation, user-role context, and relevant backend authorization.
3. Inspect the new navigation and layout QA scripts.
4. Identify any untested behavior, inconsistent route mappings, missing content, data-fetching errors, authorization weaknesses, and regressions.

Verify the actual paths and file contents before editing. Do not assume that the list above includes every relevant file.

## Phase 2: Test the Four Dedicated Pages

Test these routes independently:

- `/inspections`
- `/applications`
- `/saved`
- `/verification`

For each route, verify:

1. The page loads successfully for an authenticated, authorized user.
2. The correct page title, controls, and content appear.
3. The correct user's records are displayed using the existing database and API integrations.
4. Loading, empty, and error states are handled correctly.
5. No unrelated section is accidentally rendered.
6. No blank content area appears because of incorrect conditions, query parameters, routing, CSS, or failed requests.
7. The layout remains usable on desktop, tablet, and mobile.
8. Refreshing the route preserves the correct destination.
9. Browser back and forward navigation behave correctly.
10. Direct navigation to the route works without first visiting the profile page.

Do not insert fake records to make a page appear functional. If there is no data, display a proper empty state.

## Phase 3: Verify Sidebar Active States

Inspect `isNavigationItemActive()` and every relevant navigation entry in `src/components/app-sidebar.tsx`.

Test all four routes and verify:

- `/inspections` activates only the inspections navigation item.
- `/applications` activates only the applications navigation item.
- `/saved` activates only the saved listings navigation item.
- `/verification` activates only the trust and verification navigation item.

Also test nested routes, property detail pages, marketplace map views, dashboard routes, profile, settings, messages, and administrator tabs.

Requirements:
- Only the intended navigation destination should be highlighted.
- Query parameters must be handled deliberately.
- Parent and child routes must not create accidental multiple active states.
- Preserve intended nested-route highlighting where appropriate.
- Do not break role-specific navigation.
- Avoid fragile substring matching.
- Test the actual rendered sidebar, not just a helper function.

Fix the underlying routing or matching logic wherever necessary.

## Phase 4: Verify Authentication and Role Security

The login interface must not require users to select their role.

Verify that:

1. Users sign in using their actual credentials.
2. The authenticated user's role is obtained from the trusted server-side account/session.
3. The correct role-specific dashboard and navigation are displayed.
4. The sidebar does not expose clickable role-switching controls.
5. Users cannot grant themselves another role by editing local storage, browser state, URL parameters, or request payloads.
6. Protected pages, APIs, server actions, and data access enforce authorization on the server.
7. A missing or invalid role fails safely instead of granting permissions.
8. The `SEEKER` fallback, if present for display purposes, cannot accidentally grant access to protected resources.
9. Existing registration, password reset, logout, and session restoration still work.
10. Users cannot access another user's private inspections, applications, saved listings, or verification records.

Preserve the existing `SEEKER`, `OWNER`, `AGENT`, and `ADMIN` role model and legitimate permissions. Do not replace the authentication architecture unnecessarily.

## Phase 5: Run Automated and Browser-Based Tests

Use the project's existing scripts and testing tools. Inspect `package.json` before deciding which commands to run.

Run the applicable:
- Navigation and tab tests.
- Layout QA tests.
- Lint checks.
- TypeScript checks.
- Unit and integration tests.
- Production build.

Where browser automation is available, use Playwright or the existing end-to-end framework to test the actual UI.

Test at these viewport widths:
- 320px
- 375px
- 430px
- 768px
- 1024px
- 1366px
- 1920px

Check for horizontal overflow, clipped content, oversized cards, inaccessible controls, incorrect sidebar states, and broken mobile navigation.

If a test script only checks whether particular CSS class strings exist, do not treat that as proof of runtime correctness. Add behavioral tests where needed.

If access to the deployed environment, test credentials, or external services is unavailable, explicitly report the limitation rather than claiming that the corresponding test passed.

## Phase 6: Fix Issues and Prevent Regressions

Implement fixes for all confirmed issues discovered during the audit.

Requirements:
- Reuse the current architecture and design system.
- Preserve existing application features and real data.
- Do not replace live integrations with mock data.
- Avoid unrelated redesigns or unnecessary dependency changes.
- Add regression tests for each confirmed bug.
- Ensure that changes to shared components do not break other roles or routes.
- Keep the UI responsive and consistent with the PropHunta AI branding.

After making changes, rerun the relevant tests and production build. Fix any new failures introduced by the implementation.

## Phase 7: GitHub and Deployment Verification

If repository write access is available:

1. Make changes on a dedicated bug-fix branch.
2. Commit the fixes with a descriptive message.
3. Push the branch.
4. Report the exact commit SHA and changed files.
5. Do not claim that production has been updated unless the deployment has actually completed.

Do not overwrite unrelated work, push directly to the production branch without authorization, or expose secrets.

## Required Final Report

Provide a concise but evidence-based report containing:

1. **Confirmed bugs:** what was broken and the root cause.
2. **Fixes implemented:** files changed and what each fix accomplishes.
3. **Page-by-page results:** inspections, applications, saved listings, and verification.
4. **Authentication results:** login, role detection, and server-side authorization.
5. **Navigation results:** active-state behavior and nested routes.
6. **Test results:** commands executed and actual pass/fail outcomes.
7. **Deployment status:** commit SHA, branch, and deployment result if applicable.
8. **Outstanding issues:** anything not verified or requiring manual testing.

Clearly distinguish between tests that passed, tests that failed, and tests that could not be run.

**Execution rule:** Do not stop after reviewing the code or generating a plan. Implement the confirmed fixes, run the available tests, and report the actual results. Do not fabricate successful test results.