# Connect GitHub sign-in

Editor: https://brilliant-pavlova-12976b.netlify.app/

The catalogue’s `/admin/` URL redirects here. Keeping the editor and Netlify OAuth site on the same hostname fixes the callback handshake; the GitHub Pages catalogue stays unchanged.

GitHub OAuth is configured through Netlify project `brilliant-pavlova-12976b` (site ID `506dfa99-f4e7-4638-a16c-1f59bb01529d`). GitHub OAuth application: Energy Index Editor (3976113). The client secret lives only in Netlify provider settings. The instructions below document how to recreate the setup.

## Netlify authentication provider

1. Create/sign in to a Netlify account and create a Netlify site to anchor its OAuth provider. The public catalogue remains on GitHub Pages; do not move the domain or repository hosting.
2. Register a GitHub OAuth application in the owner's Developer settings. Use the catalogue URL as Homepage URL and `https://api.netlify.com/auth/done` as the authorization callback.
3. In the Netlify project's Project configuration → Security → OAuth settings, configure the GitHub OAuth authentication provider using that client ID and client secret. Keep the secret solely in the provider settings, not this repository or chat.
4. Set `window.ENERGY_AUTH = {site_domain:'ACTUAL-SITE-NAME.netlify.app'};` in `admin/auth-config.js`, using the actual Netlify site hostname.
5. Upload a ZIP containing `admin/index.html`, `admin/editor.js`, and `admin/auth-config.js` at the ZIP root to the existing Netlify project. The editor shell is public; GitHub authentication controls saving. Commit and deploy the catalogue, then open `/admin/` and sign in as `rohansav`. Changes to the editor files require another Netlify upload; review edits only require Publish.
6. Verify a real owner-authenticated save and resulting Pages deployment. Do not publish invented ratings as a test.

GitHub checks repository write permissions on every save. Keep the repository's collaborator access owner-only. The editor page itself is public; write access is authenticated. A login or OAuth-provider outage does not affect the read-only catalogue.

Official references:
- https://decapcms.org/docs/github-backend/
- https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/

## Publishing and recovery

Decap writes a review JSON file to GitHub. The build validates the values before deployment, so bad content does not replace the live site. Previous commits allow recovery. Save/publish before closing the editor; do not assume unsaved browser text is durable. No access tokens or secrets are stored in project source.

The editor requests `public_repo` OAuth scope. This avoids private-repository access, but GitHub OAuth cannot restrict that scope to just this one public repository; review the authorization screen before granting access.

Verified owner login and CMS save on 2026-10-29 by selecting Not rated for an already-unrated drink. No ratings or prose were invented.
