import { Pool } from "pg";

let pool: Pool | undefined;
export function databasePool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error("DATABASE_URL is required for PostgreSQL storage");
  return (pool ??= new Pool({
    connectionString,
    max: 4,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  }));
}
