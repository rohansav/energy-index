# Application architecture

## Current system

```text
src/data/catalogue.json + reviews/*.json + assets/
                    ↓
server/catalogue-repository.ts   (file adapter)
server/validation.ts             (runtime schemas)
                    ↓
app/*/page.tsx                   (server route components)
                    ↓
components/                     (typed React props)
                    ↓
Next.js static export → GitHub Pages
```

The repository returns a `Catalogue` containing `Brand[]` and `Drink[]`. Each `Drink` contains product metadata and a separate normalized `Review`. Persisted review files retain their current IDs and fields so the live Decap editor continues to work unchanged.

## Boundaries

- **Data:** `src/data/catalogue.json` is product metadata only. `reviews/` is editorial content. Neither contains rendering code.
- **Domain:** types, score colors, rating rules, filtering, ordering, and content fallbacks. These pure functions do not know about React, the browser, GitHub, or filesystem APIs.
- **Server:** reads files and validates unknown JSON. Converts Decap's decimal strings to numbers and blank/missing fields to null. No storage imports appear in client components.
- **Routes:** load data through `CatalogueRepository`, select a brand or product, define metadata/static paths, and compose the view. Invalid routes render a not-found page.
- **Components:** accept typed props. Shared `Score`, `ProductPhoto`, `SensoryProfile`, `ProductSources`, and `DrinkDetail` render the same content consistently in cards, rows, dialogs, and pages.
- **Client state:** only interactive views, dialogs, image fallbacks, and the header guide use client components. Search, filters, sorting, and modal state belong to their view, not global mutable state.
- **Styles:** formatted shared CSS preserves the established design and responsive breakpoints. Component class names are retained for a migration without a visual redesign.

React handles DOM updates and text escaping. There is no `innerHTML` templating, runtime `eval`, or script that mutates catalogue records before rendering. Build-time validation and page generation fail together; CI never deploys partial output.

## Existing editor

The Netlify-hosted Decap editor uses GitHub OAuth and writes `reviews/*.json`. Its login, repository permissions, and Publish action are unchanged. The public site's Editor link and legacy `/admin/` entry point both open that editor. No new sign-in page is introduced.

Changes to editor code still need a Netlify upload; normal review publishing does not. This refactor does not redeploy or reset the live editor. Its compatible source is kept in `admin/` and is formatted for readability.

## Future centralized database

This is a typed rendering and infrastructure migration, not a database migration. Git remains the current content store, and reviews still trigger static builds.

When community features are approved:

1. Implement `CatalogueRepository` against PostgreSQL, preserving product IDs and normalized output types.
2. Add users, roles, editorial/community review records, and server-side write validation and authorization.
3. Add review submission and moderation APIs with rate limits; keep editorial scores separate from community aggregates.
4. Move Next.js from static export to server-capable hosting and use appropriate revalidation after database writes.
5. Replace Decap's Git writer with the authenticated application workflow, then retire the Netlify OAuth helper.

The display components need not know whether their props originated from JSON or PostgreSQL. Authentication, database provisioning, and community review submissions are deliberately not implemented or simulated here.
