# Energy index

An energy drink catalogue with brand rankings and review excerpts. Built with plain HTML, CSS, and JavaScript; no build step or backend.

## Preview locally

Run `python3 -m http.server 4173` in this directory, then open http://localhost:4173.

## Edit reviews

Edit `data.js`. Each drink entry contains a stable ID, name, score (or `null` when unrated), product line, availability, source links, image metadata, and optional review excerpt. The homepage shows the top four drinks per brand; brand pages show every review, ordered by score.

The 160-entry US catalogue uses official product photos. The original 24 scores and critiques remain explicitly labeled samples; all newly researched flavors are unrated. See [SOURCES.md](SOURCES.md) for coverage, availability caveats, and image provenance.

## Publishing

GitHub Pages publishes the root directory of the `main` branch. Push changes to `main` to update the public site. Files in this repository, including review data, are public. Do not commit secrets or private drafts.

- `index.html`: catalogue landing page
- `brand.html`: brand review page
- `data.js`: brands and review data
- `app.js`: catalogue interactions
- `brand.js`: brand-page interactions
- `style.css`: layout and appearance

Typography loads from Google Fonts, with system-font fallbacks.

## Checks

Run `node --test tests/catalogue.test.cjs` before publishing data or UI changes. Images live in `assets/drinks/` and are lazy-loaded, optimized WebP files.
