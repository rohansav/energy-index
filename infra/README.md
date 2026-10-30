# Energy Index AWS infrastructure

Region: `us-east-1`. AWS CLI profile: `energy-index` (temporary browser login).

- RDS PostgreSQL 17, `db.t4g.micro`, 20 GiB gp3, Single-AZ.
- Encryption at rest, seven-day automated backups, deletion protection.
- RDS-managed master password in Secrets Manager; never sent to the frontend.
- Separate `energy_app` database login: read catalogue, update editorial reviews,
  append review history. No schema/catalogue/delete permissions.
- Lambda database handler in the VPC; separate Lambda GitHub authorizer outside
  the VPC. No NAT gateway required. API Gateway only allows authenticated owner
  access to editor routes; `/catalogue` is public published content.
- TLS certificate verification uses the official AWS RDS regional CA bundle.
- The existing Netlify editor retains its GitHub OAuth login. A Decap backend
  adapter replaces Git reads/writes with API calls. Stale saves return HTTP 409.
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
can be stale until a code deployment rebuilds it. No new sign-in UI, review form,
or dashboard is introduced by this migration.

Database cost: roughly $14/month compute/storage plus about $0.40/month for the
managed secret, before tax; a public IPv4 endpoint adds roughly $3.65/month while
enabled. API Gateway/Lambda/logging are usage billed. High availability is not
included. Keep automatic storage growth disabled unless explicitly needed.
