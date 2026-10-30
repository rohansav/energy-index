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

## PostgreSQL storage

`CatalogueRepository` now has a PostgreSQL adapter in `src/server/postgres-repository.ts`.
`CATALOGUE_STORAGE=postgres` selects it explicitly; a database error never falls back
to files. Routes and components are unchanged. Reads use a consistent transaction;
validated writes use optimistic versions and atomically append review history.

`src/server/migrate-database.ts` applies checksummed SQL migrations and imports the
file catalogue transactionally, verifying exact read-back equality. It refuses to
overwrite an existing database that differs. The original file adapter remains in
`src/server/file-catalogue.ts` for migration and the current production deployment.

See [DATABASE.md](DATABASE.md) for commands, verification, backups, and the remaining
hosted cutover. The local migration is complete; production and the editor have not
been switched. This distinction is intentional: switching the public reader before
the editor writer would strand new Git-based reviews.
