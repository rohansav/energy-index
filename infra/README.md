# Energy Index AWS infrastructure

Region: `us-east-1`. AWS CLI profile: `energy-index` (temporary browser login).

- RDS PostgreSQL 17, `db.t4g.micro`, 20 GiB gp3, Single-AZ.
- Encryption at rest, seven-day automated backups, deletion protection.
- Private DB endpoint; only the application security group can reach port 5432.
  Temporary public access used for import has been removed.
- RDS-managed master password in Secrets Manager; never sent to the frontend.
- Separate `energy_app` database login: read catalogue, update editorial reviews,
  append review history. No schema/catalogue/delete permissions.
- Lambda database handler in the VPC; separate Lambda Cognito authorizer outside
  the VPC. No NAT gateway required. API Gateway only allows authenticated owner
  access to editor routes; `/catalogue` is public published content.
- TLS certificate verification uses the official AWS RDS regional CA bundle.
- Cognito Essentials user pool, public PKCE client, email-confirmed public registration, one
  explicitly authorized editor subject. Stale review saves return HTTP 409.
- The former Netlify editor URL redirects to the integrated editor; GitHub write
  authorization is disabled.
- GitHub Pages exports a database snapshot via the public API on code deploys.
  React refreshes from the API on page load/focus, so publishing needs no rebuild.

## Operations

`aws login --profile energy-index --region us-east-1` obtains temporary credentials.
Never commit `.env.aws.json` (ignored, mode 0600); it holds the app database URL.
AWS encrypts the handler's environment variables at rest. The Lambda role needs
VPC networking and logs permissions; it does not receive the RDS master secret.

```sh
npm run check
node scripts/build-api.mjs
python3 scripts/aws/deploy-api.py
```

The deployment script updates only named Energy Index resources. Resource IDs are
account-specific. The creation operation used the account's existing default VPC
with a dedicated DB subnet group and dedicated security groups. No existing AWS
applications were changed.

The one-time import script `scripts/aws/migrate.ts` uses the RDS-managed master
secret and refuses to overwrite differing database content. It requires a secure
network path to the DB; do not open database ingress to all IP addresses.

For recovery use RDS point-in-time restore to a new instance, verify the content,
then update the API connection. Do not restore stale Git files over database edits.
The original `reviews/` files remain a pre-cutover archive, not the publishing path.

A public API outage leaves the last static HTML snapshot readable. That snapshot
can be stale until a code deployment rebuilds it. The editor uses the API directly.

Database cost: roughly $14/month compute/storage plus about $0.40/month for the
managed secret, before tax; a public IPv4 endpoint adds roughly $3.65/month while
enabled. API Gateway/Lambda/logging are usage billed. High availability is not
included. Keep automatic storage growth disabled unless explicitly needed.

Cognito configuration is reproducible with `python3 scripts/aws/setup-cognito.py`.
Public IDs and the editor subject are in `src/lib/auth-config.json`; there is no
browser client secret. The owner completed the emailed invitation and first login.
Email recovery is verified. Passwords are managed by Cognito, not stored here.

To redeploy the old-host redirect, use `netlify deploy --dir=admin/retired --prod
--site=506dfa99-f4e7-4638-a16c-1f59bb01529d --no-build`. Do not redeploy `admin/`
as the live editor. The old OAuth application is no longer trusted by the API.

## Community rollout and checks

`python3 scripts/aws/migrate-schema.py` applies checksum-verified migrations in a
temporary Lambda in the existing private VPC, grants the application only the
community table permissions it needs, verifies editorial data is unchanged, then
removes the runner. It does not reopen RDS networking or import file snapshots.

The Cognito helper scripts use the AWS CLI's bundled Python SDK on this host:
`/opt/homebrew/opt/awscli/libexec/bin/python scripts/aws/enable-community.py`.
It preserves all existing pool settings while enabling self-registration.
`verify-community.py` uses a disposable member account to exercise create/update/
delete, averages, conflicts, and editorial denial against the live API. It removes
its public test review/account and restores temporary client auth-flow settings.
Do not run that live test against a drink that already has community reviews.

Email verification/recovery currently uses Cognito's default delivery, which AWS
limits to 50 messages per day per account. Configure a verified SES sender and
production SES access before inviting enough members to exceed that volume.
https://docs.aws.amazon.com/cognito/latest/developerguide/quotas.html

Guest deployment: run `scripts/aws/migrate-schema.py`, build the API with
`node scripts/build-api.mjs`, then run `scripts/aws/deploy-api.py`. The deployer
creates and preserves a random `GUEST_RATE_SECRET` in Lambda configuration. Guest
routes validate their own `X-Guest-Token` credential; they do not use Cognito.
CORS allows that header only from the catalogue origin. Keep the secret private.
