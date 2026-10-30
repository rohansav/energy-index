# Connect GitHub sign-in

Editor: https://brilliant-pavlova-12976b.netlify.app/

The catalogue’s `/admin/` URL redirects here. Keeping the editor and Netlify OAuth site on the same hostname fixes the callback handshake; the GitHub Pages catalogue stays unchanged.

GitHub OAuth is configured through Netlify project `brilliant-pavlova-12976b` (site ID `506dfa99-f4e7-4638-a16c-1f59bb01529d`). GitHub OAuth application: Energy Index Editor (3976113). The client secret lives only in Netlify provider settings. The instructions below document how to recreate the setup.

## Netlify authentication provider

1. Create/sign in to a Netlify account and create a Netlify site to anchor its OAuth provider. The public catalogue remains on GitHub Pages.
2. Register a GitHub OAuth application in the owner's Developer settings. Use the catalogue URL as Homepage URL and `https://api.netlify.com/auth/done` as the authorization callback.
3. In the Netlify project's Project configuration → Security → OAuth settings, configure the GitHub OAuth authentication provider using that client ID and client secret. Keep the secret solely in the provider settings, not this repository or chat.
4. Set `window.ENERGY_AUTH = {site_domain:'ACTUAL-SITE-NAME.netlify.app'};` in `admin/auth-config.js`, using the actual Netlify site hostname.
5. Deploy all files in `admin/`, including `database-backend.js` and `_headers`, at the site root to the existing Netlify project. The editor shell is public; GitHub authentication controls saving. Commit and deploy the catalogue, then open `/admin/` and sign in as `rohansav`. Changes to the editor files require another Netlify upload; review edits only require Publish.
6. Verify a real owner-authenticated save and public API read. Do not publish invented ratings as a test.

The AWS API checks the GitHub user's immutable ID on every editor request and only permits the owner. The editor page itself is public; write access is authenticated. A login or OAuth-provider outage does not affect the read-only catalogue.

Official references:

- https://decapcms.org/docs/github-backend/
- https://docs.netlify.com/manage/security/secure-access-to-sites/oauth-provider-tokens/

## Publishing and recovery

Decap saves reviews through `window.ENERGY_API_URL` to AWS PostgreSQL. The API
validates ratings and notes, checks the expected version, and writes review history
in the same transaction. Publish does not commit files or trigger a Pages build.
Refresh the public page to load the latest database content. Use RDS backups for
recovery. Save before closing the editor; unsaved browser text is not durable.

The editor requests `public_repo` OAuth scope. This avoids private-repository access, but GitHub OAuth cannot restrict that scope to just this one public repository; review the authorization screen before granting access.

Verified owner login and CMS save on 2026-10-29 by selecting Not rated for an already-unrated drink. No ratings or prose were invented.

Database publishing verified on 2026-10-30, including a no-op save/reload and stale-write rejection.
