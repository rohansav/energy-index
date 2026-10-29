# Energy index

An energy drink catalogue with brand rankings and review excerpts. Built with plain HTML, CSS, and JavaScript; no build step or backend.

## Preview locally

Run `python3 -m http.server 4173` in this directory, then open http://localhost:4173.

## Edit reviews

Edit `data.js`. Each drink entry contains a stable ID, name, score (or `null` when unrated), product line, availability, source links, image metadata, and optional review excerpt. The homepage shows the top four drinks per brand; brand pages show every review, ordered by score.

The 160-entry US catalogue uses official product photos. All illustrative scores and critiques have been removed. Drinks remain unrated until a personal rating is entered. See [SOURCES.md](SOURCES.md) for coverage, availability caveats, and image provenance.

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

`alertness` is `null` or an object with `effect` (No noticeable change / Slight lift / Clear lift), `context` (caffeine consumed, time, prior caffeine, sleep, observation time), and optional `jitters`. It does not contribute numerically to Overall. Do not invent observations. Leave unrecorded fields as `null`.

The shared `scoringGuideMarkup()` in `data.js` supplies the guide on both catalogue and brand pages. `ratingFields` defines ranges and 0.1 steps; `validRating()` validates data during tests.

## Publish a rating

1. Open `data.js` locally, or open it on GitHub and choose Edit (the pencil).
2. Search for the drink's `id` or exact `name`. Edit that existing entry only.
3. Set `score` to your Overall (1.0–10.0), and `sweetness`, `tartness`, `dryness` to your intensities (0.0–5.0). All accept tenths. Keep missing values `null`, without quotes.
4. Set `notes` to a short summary and `body` to your critique. Leave product IDs, photos, and source links unchanged. Alertness is optional.
5. Locally, run `node --test tests/catalogue.test.cjs`, then commit and push to `main`. In GitHub's editor, choose Commit changes to `main`.
6. GitHub Pages publishes the change automatically. The brand rankings and homepage previews reorder by Overall, highest first; ties sort alphabetically. No manual rank field is needed.

You can also send the drink name, four ratings, and notes in this chat to have the entry updated and published. There is no on-site rating editor at present.
