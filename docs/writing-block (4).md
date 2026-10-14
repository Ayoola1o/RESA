# PropHunta AI — Build a New Public Landing Page and Redesign the Property Search Experience

## Reference websites

Public landing page: https://www.kevaai.com/

Property search reference: https://www.kevaai.com/homes?explicit=true&city=Atlanta&minPrice=10000&maxPrice=30000

Repository: https://github.com/Ayoola1o/RESA

## Objective

Create a polished, responsive public landing page for PropHunta AI and redesign the existing property search page using the reference website's general user experience as inspiration.

The landing page does not currently exist in the form I want. Inspect the actual repository and determine whether the root route `/` is missing, redirects to an authenticated workspace, or renders another page before implementing it.

The goal is a trustworthy Nigerian real-estate discovery platform, not a pixel-for-pixel copy of KevaAI.

Keep the existing Next.js, React, TypeScript, Tailwind CSS, authentication, database, component conventions and working application features wherever possible.

Do not replace working business logic with mock implementations. If mock property data is already used, preserve the existing approach and make the architecture ready for future live data.

## Stage 1 — Repository audit

Before editing, inspect:

- The root route and existing public/authenticated layouts.
- Existing property search and listing-detail routes.
- Property data models, repositories, API routes and server actions.
- Existing search filters, URL parameters and query logic.
- Authentication and role-based redirects.
- Shared navigation, property cards, buttons, form controls and design tokens.
- Existing image handling and map integrations.
- Tests, linting, type-checking and build scripts.

Identify which components can be reused and which pages already exist. Do not create duplicate routes or break the existing authenticated workspace.

First report the findings and intended files to change, then implement in small, reviewable steps.

## Stage 2 — Build the public landing page

Create a complete, responsive homepage at `/`.

### Navigation

Provide a clean public header with:

- PropHunta AI logo and brand identity.
- Properties / Explore Homes.
- How It Works.
- For Property Owners.
- For Agents.
- Sign In.
- A prominent Get Started or List Property action, as appropriate.

Ensure public navigation works for signed-out visitors and respects the existing authentication flow.

Do not show private dashboard navigation on the public homepage.

### Hero section

Create a premium real-estate hero inspired by KevaAI's emphasis on helping users find suitable homes.

Use a large, high-quality residential visual, a concise headline, supporting copy and a prominent property-search interface.

Suggested direction:

Headline: "Find a Place to Call Home."

Supporting message: "Discover properties, connect with trusted real-estate professionals, and take your next step with greater confidence."

The search interface should support the existing data model's available fields, prioritising:

- Location / city / neighbourhood.
- Rent or sale.
- Property type.
- Minimum price.
- Maximum price.

Use Nigerian naira formatting. Do not imply that properties or agents are verified unless the actual record contains the corresponding verified status.

The search CTA must navigate to `/homes` with validated filter parameters.

### Additional homepage sections

Implement a considered page hierarchy:

1. Featured or recently added properties using real available listing data.
2. How PropHunta AI works, in three to five concise steps.
3. Benefits of using the platform, especially transparent property information and verification where supported by real functionality.
4. Separate value propositions for Seekers, Owners and Agents.
5. Trust and safety information that accurately describes existing platform capabilities.
6. Clear calls to action for property discovery, owners and agents.
7. A footer with working navigation and appropriate legal/contact links if they exist.

Do not invent testimonials, transaction volumes, savings statistics, verification guarantees, agent credentials or property inventory. If production data is unavailable, use an appropriate empty state or clearly labelled development-only fixtures.

## Stage 3 — Redesign the property search page

Improve the existing `/homes` route rather than creating a competing search route.

### Page structure

- Public header consistent with the landing page.
- Search heading and results count.
- Location search.
- Filter controls.
- Sort control.
- Responsive property listing grid.
- Optional map/list layout only if a functioning map implementation and appropriate data are available.
- Pagination or load-more based on the existing data access architecture.

On desktop, use a compact filter sidebar or a well-organised horizontal filter system and a spacious listing grid. On mobile, provide a usable filter drawer or sheet with clear Apply and Reset actions.

### Filters

Implement only filters supported by the existing property schema. Where data is available, include:

- Location.
- Rent / sale.
- Property type.
- Minimum and maximum price.
- Bedrooms.
- Bathrooms.
- Other meaningful attributes already supported by the application.

Make all filters keyboard accessible and usable on touch screens.

### Property cards

Create or improve reusable listing cards with:

- Property image.
- Price with the correct currency and rental period, if applicable.
- Location.
- Property type.
- Bedroom/bathroom counts and size, where available.
- Verified badge only when the backend provides verified status.
- Save/favourite control using the existing saved-listing functionality.
- A link to the actual property detail route.

Use consistent image ratios, restrained shadows, clear typography and compact metadata. Avoid oversized cards and excessive vertical whitespace.

Do not invent property information when a field is missing.

## Stage 4 — URL-driven search behaviour

Treat `/homes` URL parameters as the canonical shareable search state.

Support appropriate query parameters such as:

- `city`
- `purpose`
- `propertyType`
- `minPrice`
- `maxPrice`
- `bedrooms`
- `bathrooms`
- `sort`

Adapt parameter names to existing conventions if the repository already defines them.

Requirements:

1. Parse and validate URL parameters on initial load.
2. Populate filter controls from the current URL.
3. Apply filters to the actual listing query.
4. Update the URL when filters are applied or cleared.
5. Preserve filters on refresh and direct navigation.
6. Support browser back/forward navigation.
7. Debounce location suggestions or text-based searches where appropriate.
8. Reject invalid numeric values and invalid filter combinations safely.
9. Preserve existing authentication and access restrictions for saved listings and private actions.
10. Avoid fetching duplicate data unnecessarily.

Use the existing routing and data-fetching patterns. If the listing data is server-rendered, preserve that behaviour where appropriate. Do not move sensitive data fetching to the client solely to simplify the UI.

## Stage 5 — Design system and responsiveness

Create a consistent visual system for the public pages:

- Premium, modern real-estate aesthetic.
- Strong visual hierarchy and readable typography.
- Consistent spacing, radii, borders, buttons and form fields.
- High-quality property imagery with sensible loading behaviour.
- Restrained use of accent colours.
- Clear hover, focus, selected, disabled, loading and error states.
- Accessible contrast and keyboard navigation.

Use the project's existing brand colours and tokens if they exist. Do not introduce an unrelated design system.

Test responsive layouts at 320, 375, 430, 768, 1024, 1280, 1440 and 1920 pixels.

Prevent horizontal overflow, oversized cards, clipped filters and broken navigation.

## Stage 6 — Preserve the three user roles

The public landing page and property discovery experience must work for all visitors, while respecting the existing roles:

- SEEKER: browse homes and use supported saved-listing, enquiry, application and inspection workflows.
- OWNER: access existing authorised listing-management workflows.
- AGENT: access existing authorised agent and property-management workflows.
- ADMIN: retain the existing protected Admin experience.

Do not merge these roles, silently change role assignments or introduce client-controlled role switching.

For authenticated users, use the existing trusted session and role-resolution logic. The public homepage must not expose private dashboard data.

## Stage 7 — Performance, accessibility and SEO

- Use the framework's recommended image optimisation.
- Avoid unnecessary heavy client components.
- Provide meaningful page titles and metadata.
- Use semantic headings, labels and accessible form controls.
- Provide alt text for meaningful images.
- Ensure loading and empty states are informative.
- Preserve query strings when sharing filtered search links.
- Avoid unsupported claims about verified listings or platform capabilities.

## Stage 8 — Testing and delivery

Test:

- Homepage rendering for signed-out visitors.
- Navigation to and from `/homes`.
- Direct opening of a filtered search URL.
- Filter state after refresh and browser back/forward.
- Actual filter application against available data.
- Missing or invalid query parameters.
- Empty search results and image-loading failures.
- Property card navigation.
- Saved-listing behaviour for authenticated users.
- Role-specific dashboard redirects.
- Mobile layout and keyboard accessibility.
- Existing property, authentication and Admin regressions.

Run the actual available lint, type-check, test and production build commands. Report the commands and real outcomes. Do not claim checks passed if they were not run.

## Definition of done

- `/` is a polished, working public landing page.
- `/homes` has a consistent, responsive property search experience.
- Search filters are reflected in the URL and actually filter the data.
- Property cards use existing data and working detail links.
- Nigerian currency formatting is correct for the available data.
- Existing role boundaries and authenticated workflows remain intact.
- No fabricated property listings, testimonials or verification claims.
- Automated checks and responsive QA results are documented.

Start by auditing the repository and identifying the exact files to change. Then implement incrementally, preserving working functionality and reporting any missing backend capabilities rather than faking them.