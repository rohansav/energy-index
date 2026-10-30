# Energy index

An energy drink catalogue built with **Next.js, React, and TypeScript**. Public pages are exported to GitHub Pages. The existing Netlify editor signs in through GitHub and publishes reviews to AWS PostgreSQL through an authenticated API.

## Run locally

Requires Node.js 22 (CI) or a supported Next.js Node version.

```sh
npm ci
npm run dev
```

Open http://localhost:3000/energy-index/. The `/energy-index` prefix matches production; `NEXT_PUBLIC_BASE_PATH` can override it for another host.

```sh
npm run check     # TypeScript + validation/component/editor tests
npm run build     # Produces out/ for static hosting
npm run format    # Formats application and editor source
```

## Publish a review

Open https://brilliant-pavlova-12976b.netlify.app/, sign in with GitHub, choose a drink, enter ratings/notes, then **Publish → Publish now**. The existing review JSON format and IDs have been preserved. `Rated` filters only on Overall. Save drafts before refreshing the editor.

Publishing saves directly to PostgreSQL. Refresh the public catalogue to see new
ratings; no GitHub build is required. Code changes still trigger GitHub Actions to
build and deploy public pages. Static HTML is retained as a fallback during API
outages. Refresh editor tabs that were opened before the database migration.

## Where to make changes

| Change                                      | File or directory                                     |
| ------------------------------------------- | ----------------------------------------------------- |
| Product names, image sources, availability  | PostgreSQL products (JSON file is an archive)         |
| Personal ratings and notes                  | Existing editor → PostgreSQL (files are an archive)   |
| Shared page shell                           | `src/components/layout/`                              |
| Catalogue and brand interactions            | `src/components/catalogue/`                           |
| Drink detail and review rows                | `src/components/drinks/`                              |
| Score colors, sensory profile, guide        | `src/components/ratings/` and `src/domain/ratings.ts` |
| Filtering, sorting, review text fallbacks   | `src/domain/catalogue.ts`                             |
| Content validation and file storage adapter | `src/server/`                                         |
| Page routes                                 | `src/app/`                                            |
| Styles                                      | `src/styles/site.css`                                 |
| Can images                                  | `assets/drinks/`                                      |
| Existing editor configuration               | `admin/`                                              |

See [ARCHITECTURE.md](ARCHITECTURE.md) for data flow and storage boundaries, [SOURCES.md](SOURCES.md) for product provenance, and [admin/SETUP.md](admin/SETUP.md) for authentication recovery.

## Routes

- `/`: catalogue with brand cards, all-flavors table, search, and quick review dialogs.
- `/brands/<slug>/`: full brand catalogue with filters and rankings.
- `/drinks/<id>/`: shareable individual drink page.
- `/admin/`: forwards to the existing editor.
- Old `/brand.html?brand=<slug>` links redirect to the corresponding brand page.

All routes sit under `/energy-index` on GitHub Pages.

## Content rules

Overall (`score`) is 1.0–10.0. Sweetness, Sourness (stored as `tartness` for compatibility), Dryness, and Energy are 0.0–5.0. All use 0.1 increments. Null or blank is unrecorded; zero is a recorded intensity. Overall is subjective, never calculated from other fields.

`notes` is the short summary (300 characters), `body` is plain-text review prose (20,000 characters). Review text is rendered through React escaping, never interpreted as HTML. Identity changes, malformed ratings, missing photos, and unknown review files fail the build.

PostgreSQL storage and migration tooling are available; see [DATABASE.md](DATABASE.md). Production now reads and writes through the AWS API. No new authentication screens, review forms, community accounts, or dashboards have been introduced. AWS infrastructure is now billable as documented in `infra/README.md`.
