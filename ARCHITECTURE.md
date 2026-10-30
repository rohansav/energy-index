# Application architecture

## Current system

```text
Existing Decap editor + GitHub OAuth
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

## Existing editor

The Netlify-hosted Decap editor retains GitHub OAuth. `admin/database-backend.js`
extends its GitHub backend for authentication while replacing review persistence
with the AWS API. The server verifies the immutable GitHub user ID on every editor
request. Review updates use an expected version and return 409 for stale writes.
Database credentials never reach the browser. Media creation/deletion is disabled.

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
