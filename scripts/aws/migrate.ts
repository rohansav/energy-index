import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import {
  migrateDatabase,
  importCatalogue,
} from "../../src/server/migrate-database";
import { loadFileCatalogue } from "../../src/server/file-catalogue";
const aws = (...args: string[]) =>
  JSON.parse(
    execFileSync(
      "aws",
      [
        "--profile",
        "energy-index",
        "--region",
        "us-east-1",
        "--output",
        "json",
        ...args,
      ],
      { encoding: "utf8" },
    ),
  );
const db = aws(
  "rds",
  "describe-db-instances",
  "--db-instance-identifier",
  "energy-index",
).DBInstances[0];
if (!["available", "backing-up"].includes(db.DBInstanceStatus))
  throw new Error("RDS is not available yet");
const secret = JSON.parse(
  aws(
    "secretsmanager",
    "get-secret-value",
    "--secret-id",
    db.MasterUserSecret.SecretArn,
  ).SecretString,
);
const pool = new Pool({
  host: db.Endpoint.Address,
  port: 5432,
  user: secret.username,
  password: secret.password,
  database: "energy_index",
  ssl: {
    ca: await readFile("infra/rds-ca.pem", "utf8"),
    rejectUnauthorized: true,
  },
});
try {
  await migrateDatabase(pool);
  const source = await loadFileCatalogue();
  console.log(
    await importCatalogue(pool, source),
    source.drinks.length,
    "drinks/reviews, exact read-back match",
  );
  let appUrl: string;
  try {
    appUrl = JSON.parse(await readFile(".env.aws.json", "utf8")).appUrl;
  } catch (error: any) {
    if (error.code !== "ENOENT") throw error;
    appUrl = `postgresql://energy_app:${randomBytes(32).toString("hex")}@${db.Endpoint.Address}:5432/energy_index`;
    await writeFile(".env.aws.json", JSON.stringify({ appUrl }), {
      mode: 0o600,
      flag: "wx",
    });
  }
  const password = new URL(appUrl).password;
  if (!/^[a-f0-9]{64}$/.test(password))
    throw new Error("Unexpected app credential format");
  const existing = await pool.query(
    "SELECT 1 FROM pg_roles WHERE rolname='energy_app'",
  );
  if (!existing.rowCount)
    await pool.query(`CREATE ROLE energy_app LOGIN PASSWORD '${password}'`);
  await pool.query("GRANT CONNECT ON DATABASE energy_index TO energy_app");
  await pool.query("GRANT USAGE ON SCHEMA public TO energy_app");
  await pool.query(
    "GRANT SELECT ON brands,products,editorial_reviews TO energy_app",
  );
  await pool.query(
    "GRANT UPDATE(score,sweetness,tartness,dryness,energy,notes,body,version,updated_at) ON editorial_reviews TO energy_app",
  );
  await pool.query("GRANT INSERT ON editorial_review_history TO energy_app");
  console.log(
    "Application role configured with review-only write permissions.",
  );
} finally {
  await pool.end();
}
