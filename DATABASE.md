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
