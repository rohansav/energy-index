import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import type {
  CommunityStats,
  CommunityEntry,
  OwnCommunityReview,
  CommunityPage,
} from "@/domain/community";
import type { Review } from "@/domain/types";
import { parseReview, productSchema } from "./validation";
import {
  ratingKeys,
  reviewValues,
  ReviewConflictError,
} from "./postgres-repository";
export interface CommunityActor {
  issuer: string;
  subject: string;
  owner: boolean;
}
const sensoryKeys = ["sweetness", "tartness", "dryness", "energy"] as const;
export const displayNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .refine((s) => !/[\u0000-\u001f\u007f]/.test(s), "Invalid display name");
export class CommunityNotFound extends Error {}
export async function communityStats(
  client: PoolClient,
  id?: string,
): Promise<Record<string, CommunityStats>> {
  const rows = (
    await client.query(
      `SELECT product_id, count(*)::int AS count, avg(score)::float8/10 AS average,
    min(score)::float8/10 AS min,max(score)::float8/10 AS max,
    ${sensoryKeys.map((k) => `avg(${k})::float8/10 AS ${k}, count(${k})::int AS ${k}_count`).join(",")},
    ARRAY[${Array.from({ length: 10 }, (_, i) => `count(*) FILTER (WHERE score/10=${i + 1})::int`).join(",")}] AS distribution
    FROM community_reviews WHERE NOT deleted ${id ? "AND product_id=$1" : ""} GROUP BY product_id`,
      id ? [id] : [],
    )
  ).rows;
  return Object.fromEntries(
    rows.map((r) => [
      r.product_id,
      {
        count: r.count,
        average: r.average,
        min: r.min,
        max: r.max,
        distribution: r.distribution,
        sensory: Object.fromEntries(
          sensoryKeys.map((k) => [
            k,
            { average: r[k], count: r[`${k}_count`] },
          ]),
        ) as CommunityStats["sensory"],
      },
    ]),
  );
}
function decode(row: any): Review {
  const product = productSchema.parse(row.metadata);
  return parseReview(
    {
      id: product.id,
      brand: product.brand,
      name: product.name,
      notes: row.notes,
      body: row.body,
      ...Object.fromEntries(
        ratingKeys.map((k) => [k, row[k] === null ? null : row[k] / 10]),
      ),
    },
    product,
  );
}
export class CommunityRepository {
  constructor(private pool: Pool) {}
  async page(
    id: string,
    sort: "newest" | "highest" | "lowest",
    offset: number,
  ): Promise<CommunityPage> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const exists = await client.query("SELECT id FROM products WHERE id=$1", [
        id,
      ]);
      if (!exists.rowCount) throw new CommunityNotFound();
      const stats = (await communityStats(client, id))[id] ?? null;
      const order =
        sort === "highest"
          ? "r.score DESC,"
          : sort === "lowest"
            ? "r.score ASC,"
            : "";
      const rows = (
        await client.query(
          `SELECT r.*,p.metadata,u.display_name,u.issuer FROM community_reviews r JOIN community_users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id WHERE r.product_id=$1 AND NOT r.deleted ORDER BY ${order} r.created_at DESC,r.user_id LIMIT 21 OFFSET $2`,
          [id, offset],
        )
      ).rows;
      const reviews: CommunityEntry[] = rows.slice(0, 20).map((r) => ({
        authorId:
          r.issuer === "energy-index:guest"
            ? createHash("sha256").update(`${r.user_id}:${id}`).digest("hex")
            : r.user_id,
        displayName:
          r.issuer === "energy-index:guest" ? "Anonymous" : r.display_name,
        review: decode(r),
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
      }));
      await client.query("COMMIT");
      return {
        stats,
        reviews,
        nextOffset: rows.length > 20 ? offset + 20 : null,
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  async mine(id: string, actor: CommunityActor): Promise<OwnCommunityReview> {
    const result = await this.pool.query(
      `SELECT u.display_name,r.*,p.metadata FROM community_users u LEFT JOIN community_reviews r ON r.user_id=u.id AND r.product_id=$3 LEFT JOIN products p ON p.id=r.product_id WHERE u.issuer=$1 AND u.subject=$2`,
      [actor.issuer, actor.subject, id],
    );
    const row = result.rows[0];
    return {
      review: row?.product_id && !row.deleted ? decode(row) : null,
      version: row?.version ?? 0,
      displayName: row?.display_name ?? "",
    };
  }
  async save(
    id: string,
    actor: CommunityActor,
    input: { version: number; displayName?: string; review?: unknown },
    remove = false,
  ) {
    if (!Number.isSafeInteger(input.version) || input.version < 0)
      throw new Error("Invalid review version");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Serialize this person's writes, including two simultaneous first submissions.
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [JSON.stringify([actor.issuer, actor.subject])],
      );
      const productResult = await client.query(
        "SELECT metadata FROM products WHERE id=$1",
        [id],
      );
      if (!productResult.rowCount) throw new CommunityNotFound();
      const product = productSchema.parse(productResult.rows[0].metadata);
      let user = (
        await client.query(
          "SELECT id FROM community_users WHERE issuer=$1 AND subject=$2",
          [actor.issuer, actor.subject],
        )
      ).rows[0];
      if (!remove) {
        const name = displayNameSchema.parse(
          actor.issuer === "energy-index:guest"
            ? "Anonymous"
            : input.displayName,
        );
        user = (
          await client.query(
            `INSERT INTO community_users(issuer,subject,display_name,role) VALUES($1,$2,$3,$4) ON CONFLICT(issuer,subject) DO UPDATE SET display_name=EXCLUDED.display_name,role=EXCLUDED.role RETURNING id`,
            [
              actor.issuer,
              actor.subject,
              name,
              actor.owner ? "editor" : "member",
            ],
          )
        ).rows[0];
      }
      if (!user) throw new CommunityNotFound();
      const prior = (
        await client.query(
          "SELECT * FROM community_reviews WHERE user_id=$1 AND product_id=$2 FOR UPDATE",
          [user.id, id],
        )
      ).rows[0];
      if ((prior?.version ?? 0) !== input.version)
        throw new ReviewConflictError();
      if (remove) {
        if (!prior || prior.deleted) throw new CommunityNotFound();
        await client.query(
          "UPDATE community_reviews SET deleted=true,version=version+1,updated_at=now() WHERE user_id=$1 AND product_id=$2",
          [user.id, id],
        );
      } else {
        const review = parseReview(input.review, product);
        if (review.score === null)
          throw new Error("Overall rating is required");
        await client.query(
          `INSERT INTO community_reviews(user_id,product_id,score,sweetness,tartness,dryness,energy,notes,body) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(user_id,product_id) DO UPDATE SET score=EXCLUDED.score,sweetness=EXCLUDED.sweetness,tartness=EXCLUDED.tartness,dryness=EXCLUDED.dryness,energy=EXCLUDED.energy,notes=EXCLUDED.notes,body=EXCLUDED.body,deleted=false,version=community_reviews.version+1,updated_at=now()`,
          [user.id, id, ...reviewValues(review)],
        );
      }
      await client.query(
        `INSERT INTO community_review_history(user_id,product_id,version,review) SELECT user_id,product_id,version,to_jsonb(r) FROM community_reviews r WHERE user_id=$1 AND product_id=$2`,
        [user.id, id],
      );
      await client.query("COMMIT");
      return { version: input.version + 1 };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
