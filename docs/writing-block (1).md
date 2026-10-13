# PropHunta AI — Comprehensive Role Isolation, Login Security & Authorization Penetration Test

Act as a senior application security engineer, penetration tester, and full-stack developer. Audit and test my existing PropHunta AI / RESA application to ensure that accounts belonging to different roles remain completely isolated.

**Repository:** https://github.com/Ayoola1o/RESA

**Primary objective:** Prove that users authenticated as SEEKER, OWNER, AGENT, and ADMIN cannot impersonate one another, inherit another role's permissions, access another user's private records, or bypass authentication and authorization controls.

This is an authorized security test of my own application. Inspect the existing implementation, create a systematic test plan, execute the tests using a safe test environment, fix confirmed vulnerabilities, and rerun the tests.

Do not assume the application is secure merely because the UI hides unauthorized navigation links.

## Phase 1: Map the Authentication and Authorization Architecture

Inspect the actual codebase and identify:

- Login and logout flows.
- Registration and account-role assignment.
- Session, cookie, token, and refresh-token handling.
- User model and role definitions.
- Authentication middleware and route guards.
- API endpoints and server actions.
- Database queries and record-ownership checks.
- Sidebar and dashboard role selection.
- Profile, inspection, application, saved-listing, and verification endpoints.
- Administrative functions and privileged operations.
- Any client-side role context, local storage, or session storage.
- Vercel deployment configuration and security-related environment variables.

Determine where authentication and authorization are enforced. Identify every place where the client might influence a role or user identity.

Use the existing role model:
- `SEEKER`
- `OWNER`
- `AGENT`
- `ADMIN`

Follow the actual enum values and role conventions found in the repository.

Produce a role-permission matrix based on the application's existing intended behavior. Do not invent permissions or silently grant additional privileges.

## Phase 2: Create Isolated Test Accounts

Use dedicated test accounts and synthetic records in a non-production environment.

Create or identify, where supported, at least:
- One SEEKER account.
- One OWNER account.
- One AGENT account.
- One ADMIN account.
- A second account within a role, preferably another SEEKER, to test same-role data isolation.

Give each account unique test records so unauthorized access can be detected.

For example:
- Seeker A owns a test set of saved listings and inspection requests.
- Seeker B owns a different set of saved listings and inspection requests.
- Owner A manages specific test properties and applications.
- Agent A has separate assigned records.
- Admin A has only the privileges explicitly defined by the application.

Use synthetic test data only. Never use real users' private data or production records for destructive testing.

Do not expose passwords, tokens, session cookies, or secrets in logs or the final report.

## Phase 3: Test Cross-Role Login Isolation

Authenticate each test account independently.

For every account, verify that:
1. The backend identifies the correct authenticated user.
2. The role is obtained from the trusted server-side identity or session.
3. The correct dashboard and navigation are rendered.
4. The correct user profile and records are loaded.
5. Signing out ends the appropriate session.
6. Signing in as a different account does not reuse the previous account's identity, permissions, or cached private data.
7. Refreshing the browser preserves the correct account and role.
8. Opening another browser tab does not unexpectedly change the identity of an existing session.
9. Session expiration and reauthentication work correctly.
10. Switching accounts clears any stale account-specific state.

Test these transitions:

- SEEKER → logout → OWNER login.
- OWNER → logout → AGENT login.
- AGENT → logout → ADMIN login.
- ADMIN → logout → SEEKER login.
- SEEKER A → logout → SEEKER B login.

Verify the identity after each transition, not just the visible role label.

Investigate cookie scope, token invalidation, server-side session handling, client caches, query caching, and state persistence if private information appears to carry over.

## Phase 4: Attempt Role Impersonation and Privilege Escalation

Using authorized test accounts, attempt to change the apparent role without legitimate authorization.

Test whether a lower-privileged account can gain unauthorized access by:

- Editing a role value in local storage or session storage.
- Modifying client-side state or React context.
- Changing URL query parameters.
- Altering request payloads containing `role`, `userId`, `ownerId`, or similar fields.
- Calling protected APIs directly rather than using the UI.
- Replaying a request with a different target user ID.
- Opening another role's dashboard URL directly.
- Manipulating cookies or unsigned client-side role claims.
- Attempting to reuse a token after logout or expiration.
- Submitting registration or profile-update requests with an unauthorized role assignment.
- Modifying object identifiers in API routes.

Use only non-destructive requests and test records.

Expected result:
- The server derives identity from a validated session or token.
- The server determines authorization from trusted role assignments.
- Client-supplied role values never grant privileges.
- Unauthorized requests are rejected with appropriate HTTP status codes, normally `401` for unauthenticated requests and `403` for authenticated users lacking permission, or a consistent secure alternative.
- No private data is returned before authorization checks complete.

Do not treat changing the displayed role label as proof of a privilege-escalation vulnerability. Verify whether actual protected resources or actions become accessible.

## Phase 5: Test Every Role Against Every Role

Create an authorization test matrix covering all role pairs.

For each protected page, API endpoint, server action, and sensitive operation, test:

| Authenticated role | Target permission or resource | Expected outcome |
|---|---|---|
| SEEKER | SEEKER-owned data | Allowed only for the correct account |
| SEEKER | OWNER-only functions | Denied unless explicitly authorized |
| SEEKER | AGENT-only functions | Denied unless explicitly authorized |
| SEEKER | ADMIN-only functions | Denied |
| OWNER | OWNER-owned data | Allowed only for authorized records |
| OWNER | SEEKER-private data | Denied unless explicitly authorized |
| OWNER | AGENT-only functions | Denied unless explicitly authorized |
| OWNER | ADMIN-only functions | Denied |
| AGENT | AGENT-authorized records | Allowed within assigned scope |
| AGENT | Unassigned OWNER or SEEKER data | Denied unless explicitly authorized |
| AGENT | ADMIN-only functions | Denied |
| ADMIN | Administrative functions | Allowed only within defined admin permissions |
| Any user | Another user's private records | Denied unless an explicit permission allows access |

Test all role pairs against actual application permissions. A role may legitimately access certain shared resources, so do not block intended business workflows simply because the roles differ.

ADMIN privileges must be explicitly defined and tested; do not assume they automatically override every security boundary.

## Phase 6: Test User-Owned Data Isolation

This is a critical part of the test.

Check that every sensitive database query and API operation validates the authenticated user's ownership or assigned access scope.

Test isolation for:
- Profiles and account settings.
- Property listings and property-management records.
- Inspections and inspection schedules.
- Applications and offers.
- Saved listings and favorites.
- Messages and enquiries.
- Leases and rental documents.
- Maintenance requests.
- Identity verification records and uploaded documents.
- Notifications and activity history.
- Reports and financial information, if implemented.

For each data category:
1. Sign in as the legitimate owner of a test record.
2. Confirm the record is accessible as intended.
3. Sign in as a different account.
4. Attempt to read the record using its identifier.
5. Attempt to update or delete it using safe test data.
6. Confirm the server rejects unauthorized operations.
7. Verify that the operation has no side effects and no sensitive data is disclosed.

Pay special attention to insecure direct object references (IDOR/BOLA): a user must not gain access simply by changing a record ID in a URL or API request.

Verify authorization at the data-access layer or server-side business logic, not only in page components.

## Phase 7: Test Authentication and Session Security

Test:
- Missing, invalid, expired, and malformed authentication tokens.
- Logout followed by attempts to reuse an old token.
- Session expiration and refresh behavior.
- Login failures and account error handling.
- Unauthorized access to protected routes.
- Session fixation risks where applicable.
- Cookie `HttpOnly`, `Secure`, and `SameSite` settings where applicable.
- CSRF protections for cookie-authenticated state-changing requests, where applicable.
- Cross-account caching and stale client state.
- Concurrent sessions and account switching.
- Password-reset and account-recovery flows.
- Server-side session invalidation when supported.

Do not disable security controls or weaken authentication merely to make tests pass.

Do not perform denial-of-service tests, destructive production actions, credential stuffing, or tests against third-party systems.

## Phase 8: Test Role-Specific UI and Navigation

Verify that:
- The login page does not ask users to select their role.
- The authenticated sidebar does not allow arbitrary role switching.
- The displayed role comes from the authenticated account.
- Each role sees only the intended navigation items.
- Direct navigation to unauthorized pages is blocked.
- Hidden navigation links cannot be bypassed by calling the underlying API.
- Logging into a different account does not show the previous account's name, records, notifications, or cached page content.
- Role-specific layouts and navigation remain correct on mobile and desktop.

UI hiding is a usability feature; server-side authorization remains mandatory.

## Phase 9: Automate the Security Tests

Use the existing testing framework. Inspect `package.json` and current tests before choosing additional dependencies.

Where suitable, use Playwright for browser-based account transitions and the project's existing API test framework for authorization checks.

Create reusable test helpers that:
- Authenticate as a designated test account.
- Send requests using that account's actual session.
- Record the endpoint and expected authorization outcome.
- Verify response codes and absence of unauthorized data.
- Confirm unauthorized mutations did not occur.
- Clean up only the synthetic records created by the tests.

Create regression tests for every confirmed vulnerability.

Include a test that explicitly verifies a Seeker cannot obtain Owner, Agent, or Admin permissions by changing client-side values, and equivalent tests for the other roles.

Tests must use isolated test accounts and environments. Never print secrets or complete session tokens to the test output.

## Phase 10: Fix Confirmed Vulnerabilities

Fix every confirmed security defect found during testing.

Prioritize:
1. Server-side authentication and authorization bypasses.
2. Cross-account private data exposure.
3. Role escalation and unauthorized role assignment.
4. IDOR/BOLA vulnerabilities.
5. Session invalidation and cross-account state leakage.
6. Missing route protection.
7. UI navigation inconsistencies.

Follow the existing application architecture wherever possible.

Do not:
- Replace the authentication system unnecessarily.
- Remove legitimate functionality.
- Grant ADMIN access as a fallback.
- Trust client-supplied identity or role values.
- Replace production integrations with mock data.
- Mark tests as passed without executing them.
- Disable tests or loosen authorization checks just to achieve a green build.

## Phase 11: Verify and Report

After implementing fixes:
- Rerun all relevant security tests.
- Rerun lint, type checks, and the production build.
- Rerun the previously failing tests to demonstrate that the vulnerabilities are resolved.
- Confirm normal authorized workflows still work for every role.

Provide a final report containing:

1. **Overall result:** PASS, FAIL, or PARTIAL, based on the executed tests.
2. **Test coverage:** accounts, roles, endpoints, pages, and data categories tested.
3. **Vulnerabilities found:** severity, affected file or endpoint, root cause, and reproducible test scenario without exposing secrets.
4. **Fixes applied:** files changed and the security improvement made.
5. **Role-isolation matrix:** expected versus actual results.
6. **Cross-account data isolation:** which record types were verified.
7. **Automated test results:** commands executed, passed tests, failed tests, and skipped tests.
8. **Remaining risks:** tests blocked by missing credentials, unavailable services, or untested paths.
9. **Git status:** branch, commit SHA, and deployment status if applicable.

Use these severity levels:
- Critical: authentication bypass or broad unauthorized access to sensitive data.
- High: role escalation or access to another user's sensitive records.
- Medium: limited authorization failures or security-control weaknesses.
- Low: minor information disclosure or defense-in-depth issues.

Do not claim the application is secure simply because the build succeeds or the UI looks correct.

**Final objective:** demonstrate with executable tests that each account remains isolated to its authenticated identity, assigned role, and authorized data scope, and that any cross-role or cross-account access is explicitly permitted by the application's actual business rules.