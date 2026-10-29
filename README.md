# Energy index

An energy drink catalogue with brand rankings and review excerpts. Built with plain HTML, CSS, and JavaScript; a validated static build and a GitHub-backed review editor.

## Preview locally

Run `node scripts/build.cjs`, then `python3 -m http.server 4173 --directory dist`. Open http://localhost:4173.

## Edit reviews

Open `/admin/` (which forwards to the editor on Netlify) and sign in with GitHub using the connected Netlify OAuth provider. Choose a drink, select Overall, Sweetness, Tartness and Dryness in the dropdowns, write a short summary and notes, then Publish. Publishing commits the review JSON to `main`; the workflow validates it, builds the public site, and deploys. A CMS save confirms the GitHub commit, not completion of the Pages deployment. Check Actions if the public site has not updated.

Review content lives in `reviews/<drink-id>.json`. Product names, IDs, photos and catalogue provenance live in `data.js`; don't edit ratings there. The build converts review dropdown strings into numeric values and merges only the four ratings and written notes. Blank ratings become null. Unknown IDs, changed identities and invalid scores fail the build, leaving the previous deployment live.

All illustrative scores and critiques have been removed. See [SOURCES.md](SOURCES.md) for catalogue provenance.

## Publishing

GitHub Pages publishes the validated `dist/` artifact from `.github/workflows/pages.yml`. Push changes to `main` to update the public site. Files in this repository, including review data, are public. Do not commit secrets or private drafts.

- `index.html`: catalogue landing page
- `brand.html`: brand review page
- `data.js`: brands and review data
- `app.js`: catalogue interactions
- `brand.js`: brand-page interactions
- `style.css`: layout and appearance

Typography loads from Google Fonts, with system-font fallbacks.

## Checks

Run `node --test tests/*.test.cjs` before publishing data or UI changes. Images live in `assets/drinks/` and are lazy-loaded, optimized WebP files.

## Rating rubric

`score` is the displayed **Overall**: a subjective 1.0–10.0 verdict, in 0.1 increments. It is informed by taste and the sensory profile, not computed from a formula. Rankings use this value.

`sweetness`, `tartness`, and `dryness` are independent intensity values from 0.0–5.0, in 0.1 increments. Use `null` for unrecorded values; 0 means explicitly tasted and absent. All numeric ratings display one decimal. There are no finish or carbonation rating fields.

`alertness` is `null` or an object with `effect` (No noticeable change / Slight lift / Clear lift), `context` (caffeine consumed, time, prior caffeine, sleep, observation time), and optional `jitters`. It does not contribute numerically to Overall. Do not invent observations. Leave unrecorded fields as `null`.

The shared `scoringGuideMarkup()` in `data.js` supplies the guide on both catalogue and brand pages. `ratingFields` defines ranges and 0.1 steps; `validRating()` validates data during tests.

## Manual rating updates

Edit the existing `reviews/<drink-id>.json` file locally or in GitHub. `score` means Overall (1.0–10.0); sweetness, tartness and dryness use 0.0–5.0. Use tenths, or null for unrecorded values. `notes` is the short summary; `body` is the full review. Keep id, brand and name unchanged. Commit to main to publish. Rankings reorder automatically by Overall, then alphabetically for ties and unrated drinks.

## Authentication

GitHub OAuth uses the Netlify project `brilliant-pavlova-12976b`. Public configuration is in `admin/auth-config.js`; the client secret stays in Netlify provider settings. See `admin/SETUP.md` for recovery instructions. The public catalogue stays on GitHub Pages.
