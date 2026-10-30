import { createHash, createHmac } from "node:crypto";
import type { Pool } from "pg";
export class GuestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function guestActor(token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new GuestError(
      401,
      "This browser's guest credential is missing or invalid.",
    );
  return {
    issuer: "energy-index:guest",
    subject: createHash("sha256").update(token).digest("hex"),
    owner: false,
  };
}
export async function limitGuest(pool: Pool, subject: string, ip: string) {
  const secret = process.env.GUEST_RATE_SECRET;
  if (!secret) throw new Error("Guest protection unavailable");
  const hour = Math.floor(Date.now() / 3600000);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM guest_rate_limits WHERE expires_at < now()",
    );
    for (const [identity, limit] of [
      [`network:${ip}`, 20],
      [`guest:${subject}`, 10],
    ] as const) {
      const key = createHmac("sha256", secret)
        .update(`${hour}:${identity}`)
        .digest("hex");
      const result = await client.query(
        `INSERT INTO guest_rate_limits(key,count,expires_at) VALUES($1,1,now()+interval '2 hours') ON CONFLICT(key) DO UPDATE SET count=guest_rate_limits.count+1 RETURNING count`,
        [key],
      );
      if (result.rows[0].count > limit)
        throw new GuestError(
          429,
          "Too many guest submissions. Please try again in an hour.",
        );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
