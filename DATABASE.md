# PostgreSQL storage and migration

## Status

Production storage is AWS RDS PostgreSQL in `us-east-1`. All six brands and 161
products/review records were imported with exact read-back verification.

The integrated editor uses Cognito sign-in and saves ratings and notes through
an owner-authorized API. Public pages refresh their catalogue from the same API
on load/focus. The login migration changes no database tables or review fields.

See [infra/README.md](infra/README.md) for deployed infrastructure and operations.

## Storage

- `brands`: brand identity, display colors, ordering.
- `products`: stable ID and brand foreign key, ordering, validated JSONB metadata.
- `editorial_reviews`: one review per drink, integer tenths for exact ratings,
  notes, body, version, modification time.
- `editorial_review_history`: original imported review and each subsequent saved
  version. Writes to current review and history commit atomically.
- `schema_migrations`: immutable migration checksums and application dates.

Runtime validation checks all values and drink identities before a save. SQL also
enforces foreign keys, rating ranges and text length limits. An expected version
prevents concurrent stale saves from silently overwriting content. Storage methods
are trusted server-only operations; they are not anonymous HTTP endpoints.

## Configure and import

Use a dedicated PostgreSQL database. Set `DATABASE_URL` in the server/CI secret
store or local shell; never in a `NEXT_PUBLIC_*` variable. Use the provider's TLS
connection string without disabling certificate verification. The CLI reads shell
environment variables; unlike Next.js it does not automatically load `.env.local`.

```sh
npm run db:migrate
npm run db:import
npm run db:verify
CATALOGUE_STORAGE=postgres npm run build
```

Schema changes run under a transaction and migration lock. Import locks the target
tables, inserts the full catalogue, compares every normalized value on read-back,
then commits. Any failure rolls the import back. Re-running an identical import
verifies it; an existing database with different content is never overwritten.
Never use the importer as an ongoing Git-to-database sync.

`db:verify` compares the current database against the file snapshot. Differences
are expected once the database becomes authoritative and receives new reviews.
`CATALOGUE_STORAGE=postgres` requires a working database; errors never silently
fall back to old files. Local development defaults to `files`; production explicitly selects `http`.

## Production publishing and recovery

`reviews/` and `src/data/catalogue.json` are the preserved pre-migration snapshot.
They are not the live content store. Do not re-import them over newer DB content.
The importer refuses to overwrite differences as an additional guard.

GitHub Pages builds use `CATALOGUE_STORAGE=http` and the public API URL in repository
variables. These are public configuration, not database credentials. Pages include
a static snapshot for resilience and search indexing; the browser reads current
ratings directly from PostgreSQL through the API. Code deploys still build pages;
review publishing no longer does.

RDS has seven-day automated backups. Restore to a new RDS instance, verify content,
then update the API connection. Static HTML fallback can be stale during an API
outage. Refresh editor tabs opened before the migration before publishing again.

## Backup and tests

```sh
npm run db:export -- /private/path/catalogue-snapshot.json
```

This exports the normalized catalogue without overwriting existing files. Use
provider backups or `pg_dump` for a full backup including history/schema. Keep
backups outside the repository.

Set `TEST_DATABASE_URL` to a **fresh dedicated test database**, then run
`npm run check`. Integration tests refuse to run against an existing products
table. They import actual content, test exact round trips, reject malformed values,
test competing writes, verify history, and confirm re-import cannot erase edits.
Synthetic test edits exist only in that separate test database. CI also builds all
public pages using the test database. Without this variable the integration test
is explicitly skipped.

## Community reviews

Migration `002_community.sql` adds `community_users` (stable Cognito issuer/subject,
public display name, server-assigned role), `community_reviews` (one row per user
and product), and versioned `community_review_history`. Editorial reviews remain
one separate record per product. No editorial ratings are included in community
aggregates. Community Overall is required; the other four ratings are nullable.
All ratings remain integer tenths in storage.

Deletion marks the community row deleted and appends history. Deleted rows are
excluded from public lists and aggregates; republishing reuses the same identity
and increments the version. The API derives ownership from verified Cognito
claims, never from a user ID supplied in the request. Writes are transactional,
serialized per account, and reject stale versions with HTTP 409.

Aggregates use grouped SQL: count, exact unrounded mean, min/max, ten distribution
bins (1.0–1.9 through 9.0–9.9, then 10.0), and separate count/mean per optional
category. Public displays round to one decimal. Reads for a drink's stats and list
share a repeatable-read snapshot. Lists support newest/highest/lowest, 20 at a time.

Guest reviews use the existing community tables with issuer `energy-index:guest`.
The browser generates a 256-bit random credential and keeps it in localStorage;
the API stores only its SHA-256 digest as the private subject. Guest names are
server-enforced as Anonymous. Public guest author IDs are scoped to each drink,
so they neither reveal the credential nor link a guest across drinks.
Guest ratings contribute to the same aggregates as account reviews. Editorial
reviews remain separate. Browser-data deletion loses ownership access; another
browser is a different guest. This is not proof of unique people.

Guest writes have atomic database limits of 10 per credential and 20 per network
address per clock hour, including edits/deletes. Network addresses are HMAC-hashed
with a server secret and the hour; raw addresses are not saved in this table.
Rate records expire after two hours and are purged on subsequent guest writes.
A hidden website field rejects basic form bots. No CAPTCHA or moderation queue
is configured. These controls discourage abuse but cannot prevent distributed
or determined duplicate voting. Hosting providers may retain network logs.
