# PostgreSQL storage and migration

## Status

PostgreSQL storage is implemented and tested. All six brands and 161 products with
their editorial review records have been migrated and verified in a **local**
PostgreSQL database. This is not a production cutover. The hosted site and existing
Decap editor still use Git files until a hosted database and server-side editor
connection are configured together.

No new product UI, accounts, review forms, or dashboard are part of this change.

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
fall back to old files. The default remains `files` during the cutover period.

## Production cutover still required

1. Connect a hosted database and a server runtime (the existing Netlify account
   can host a server endpoint). GitHub Pages cannot run database code.
2. Keep the existing editor UI and GitHub sign-in, but replace its Git persistence
   with an authenticated server adapter. Verify GitHub identity and repository
   owner authorization on the server for every write. Never send database
   credentials to the editor. Read the review and version in one snapshot.
3. Pause editor publishing briefly, pull the latest review files, import into the
   hosted database, and verify all fields. The local rehearsal is not the final
   source if reviews have since changed.
4. Switch both reader and writer together. Do not switch only the public build:
   Git-based editor saves would then stop appearing. With static Pages, publish
   still needs a rebuild; a server-rendered host or public read API is needed to
   remove per-edit builds. No such endpoint is claimed as deployed yet.
5. Verify an authenticated save, reload, and public read before retiring file
   publishing. Retain the last Git snapshot for recovery. After DB-only edits,
   rolling back requires exporting those edits first; old files will be stale.

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
