# Energy index

An energy drink catalogue built with **Next.js, React, and TypeScript**. Public pages are exported to GitHub Pages. The integrated editor signs in through Amazon Cognito and publishes reviews to AWS PostgreSQL through an authenticated API.

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

Open https://rohansav.github.io/energy-index/editor/, sign in, choose a drink, enter ratings/notes, then **Publish review**. The existing review format and IDs have been preserved. `Rated` filters only on Overall.

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

### Integrated editor

Open https://rohansav.github.io/energy-index/editor/ and choose **Sign in**.
The editor account uses its email address as the username. On first use, enter the
temporary password from the Cognito invitation and choose a new password. Search
or filter by brand and Rated/Unrated, select a drink, update the dropdowns and
notes, then choose **Publish review**. Rated means Overall is set, regardless of
other fields. Publishing writes directly to the existing database.

The editor warns before discarding changes and keeps unpublished edits in the
same browser tab across reauthentication/reload. A stale save is rejected rather
than overwriting a newer review; copy your notes before reloading the drink after
a conflict. The previous Netlify URL redirects to this editor; GitHub tokens no longer authorize review writes.

### Community reviews

Each drink opens its own page with an editor review, separate community average,
range/distribution and category averages, followed by community reviews. Choose
**Sign in / Join**, confirm your email, and enter a public display name. Overall is
required; other ratings and notes are optional. Publishing is immediate. One review
per account per drink counts toward the average; editing updates that contribution,
and deleting removes it. Your email and login identity are not shown publicly.
The editor account may submit a separate community review, but its editorial
review never counts automatically as a community vote.

Visitors can choose **Review as a guest** without creating an account. Guest
reviews show **Anonymous** and can be edited/deleted from the same browser.
Clearing site data loses that access. Signed-in reviewing remains available.
Guest reviews publish immediately and count toward community statistics.
