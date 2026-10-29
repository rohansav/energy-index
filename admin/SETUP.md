# Connect GitHub sign-in

Editor: https://rohansav.github.io/energy-index/admin/

The editor is implemented, but authenticated publishing cannot work until an OAuth provider is configured. The current setup page is intentional; there is no fake login or client-side password protection.

## Netlify authentication provider

1. Create/sign in to a Netlify account and create a Netlify site to anchor its OAuth provider. The public catalogue remains on GitHub Pages; do not move the domain or repository hosting.
2. Register a GitHub OAuth application in the owner's Developer settings. Use the catalogue URL as Homepage URL and `https://api.netlify.com/auth/done` as the authorization callback.
3. In the Netlify project's Project configuration → Security → OAuth settings, configure the GitHub OAuth authentication provider using that client ID and client secret. Keep the secret solely in the provider settings, not this repository or chat.
4. Set `window.ENERGY_AUTH = {site_domain:'ACTUAL-SITE-NAME.netlify.app'};` in `admin/auth-config.js`, using the actual Netlify site hostname.
5. Commit and deploy, open `/admin/`, sign in as `rohansav`, and authorize the requested GitHub access after reviewing its permissions.
6. Verify a real owner-authenticated save and resulting Pages deployment. Do not publish invented ratings as a test.

GitHub checks repository write permissions on every save. Keep the repository's collaborator access owner-only. The editor page itself is public; write access is authenticated. A login or OAuth-provider outage does not affect the read-only catalogue.

Official references:
- https://decapcms.org/docs/github-backend/
- https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/

## Publishing and recovery

Decap writes a review JSON file to GitHub. The build validates the values before deployment, so bad content does not replace the live site. Previous commits allow recovery. Save/publish before closing the editor; do not assume unsaved browser text is durable. No access tokens or secrets are stored in project source.

The editor requests `public_repo` OAuth scope. This avoids private-repository access, but GitHub OAuth cannot restrict that scope to just this one public repository; review the authorization screen before granting access.
