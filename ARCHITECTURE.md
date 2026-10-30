# Application architecture

## Current system

```text
Integrated React editor + Cognito PKCE login
                  ↓ owner-authorized API Gateway routes
AWS Lambda → RDS PostgreSQL → public /catalogue API
                  ↓
Next.js routes → typed React components → GitHub Pages
                  ↓
Browser refreshes published data through /catalogue on load/focus
```

The repository returns a `Catalogue` containing `Brand[]` and `Drink[]`. Each `Drink` contains product metadata and a separate normalized `Review`. Persisted review records retain their existing IDs and fields.

## Boundaries

- **Data:** `src/data/catalogue.json` is product metadata only. `reviews/` is editorial content. Neither contains rendering code.
- **Domain:** types, score colors, rating rules, filtering, ordering, and content fallbacks. These pure functions do not know about React, the browser, GitHub, or filesystem APIs.
- **Server:** reads through the selected database/API adapter and validates unknown JSON. Converts Decap's decimal strings to numbers and blank/missing fields to null. No storage imports appear in client components.
- **Routes:** load data through `CatalogueRepository`, select a brand or product, define metadata/static paths, and compose the view. Invalid routes render a not-found page.
- **Components:** accept typed props. Shared `Score`, `ProductPhoto`, `SensoryProfile`, `ProductSources`, and `DrinkDetail` render the same content consistently in cards, rows, dialogs, and pages.
- **Client state:** only interactive views, dialogs, image fallbacks, and the header guide use client components. Search, filters, sorting, and modal state belong to their view, not global mutable state.
- **Styles:** formatted shared CSS preserves the established design and responsive breakpoints. Component class names are retained for a migration without a visual redesign.

React handles DOM updates and text escaping. There is no `innerHTML` templating, runtime `eval`, or script that mutates catalogue records before rendering. Build-time validation and page generation fail together; CI never deploys partial output.

## Editor publishing

The integrated editor preserves the existing ratings and notes. Review updates
use an expected version and return 409 for stale writes. Database credentials
never reach the browser. Media creation/deletion is disabled. The old Decap
source is retained only for historical reference.

## Storage and delivery

`PostgresCatalogueRepository` provides consistent reads and transactional validated
writes with history. The HTTP repository lets static Next.js builds read the same
published data without DB credentials. `useLiveCatalogue` refreshes client-side
content without triggering deployments. These transports preserve the existing
`Catalogue`/`Drink`/`Review` shapes and rendering components.

`file-catalogue.ts` and the original JSON files remain for migration, tests, and
recovery reference. They no longer control live publishing. Migration scripts
refuse to overwrite differing database records. See [DATABASE.md](DATABASE.md) and
[infra/README.md](infra/README.md) for operations and recovery.

## Integrated editor and Cognito

`/editor/` is the typed React replacement for Decap. `Editor` coordinates loading,
filters and versioned saves; `ReviewForm` owns the five rating dropdowns and note
fields. `/auth/callback/` completes authorization-code login with PKCE using
`oidc-client-ts`. Session tokens and unpublished drafts are scoped to the browser
tab. Drafts are scoped to the authenticated subject and cleared after publishing.

Cognito Essentials handles passwords and recovery. Public registration is disabled.
The API authorizer verifies the access-token signature, issuer, client, expiry,
and token use with `aws-jwt-verify`, then requires the configured editor subject.
Being signed in alone does not grant publishing access. No password or client
secret is shipped in the site. `auth-config.json` contains public identifiers only.

The owner's Cognito login and browser publish/reload were verified.
`legacyDisabled: true` disables GitHub authorization, and the Netlify URL redirects
to `/editor/`. Community accounts, reviews, and moderation are outside this migration.

## Shared editor session and review links

`SessionProvider` lives in the root layout and observes Cognito login, logout,
expiry, refresh, and window focus. The existing session-storage tokens survive
navigation and refresh in the same tab; passwords are never persisted by the app.
`SessionControl` shows the login state in the header. `ReviewAction` appears only
for the configured editor on the homepage previews and brand rows. API permission
checks remain authoritative.

Review links use `/editor/?drink=<stable-id>`. The editor loads that review from the
API. OAuth state preserves the intended page through login; `safeReturnPath`
rejects external destinations and callback loops. An existing unpublished draft
is restored first to prevent a review link from silently discarding work.
