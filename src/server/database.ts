import { Pool } from "pg";
import { readFileSync } from "node:fs";

let pool: Pool | undefined;
export function databasePool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error("DATABASE_URL is required for PostgreSQL storage");
  return (pool ??= new Pool({
    connectionString,
    ...(process.env.DATABASE_CA_FILE
      ? {
          ssl: {
            ca: readFileSync(process.env.DATABASE_CA_FILE, "utf8"),
            rejectUnauthorized: true,
          },
        }
      : {}),
    max: 4,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  }));
}
