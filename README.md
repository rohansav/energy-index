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

## Rating rubric

`score` is the displayed **Overall**: a subjective 1.0–10.0 verdict, in 0.1 increments. It is informed by taste and the sensory profile, not computed from a formula. Rankings use this value.

`sweetness`, `tartness`, and `dryness` are independent intensity values from 0.0–5.0, in 0.1 increments. Use `null` for unrecorded values; 0 means explicitly tasted and absent. All numeric ratings display one decimal. There are no finish or carbonation rating fields.

`alertness` is `null` or an object with `effect` (No noticeable change / Slight lift / Clear lift), `context` (caffeine consumed, time, prior caffeine, sleep, observation time), and optional `jitters`. It does not contribute numerically to Overall. Do not invent observations. Existing sample scores remain labeled; the new fields are empty pending actual tastings. When publishing a real review, set `sampleReview: false`.

The shared `scoringGuideMarkup()` in `data.js` supplies the guide on both catalogue and brand pages. `ratingFields` defines ranges and 0.1 steps; `validRating()` validates data during tests.
