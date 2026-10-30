import { guestActor, limitGuest, GuestError } from "../server/guest-reviews";
import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import { z, ZodError } from "zod";
import {
  CommunityRepository,
  CommunityNotFound,
} from "../server/community-repository";
import { databasePool } from "../server/database";
import {
  PostgresCatalogueRepository,
  ReviewConflictError,
  ratingKeys,
} from "../server/postgres-repository";
import { parseReview, productSchema } from "../server/validation";

const repository = () => new PostgresCatalogueRepository(databasePool());
const reply = (statusCode: number, data: unknown) => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(data),
});

export async function handler(
  event: APIGatewayProxyEventV2WithLambdaAuthorizer<{
    owner: string;
    subject?: string;
    issuer?: string;
  }>,
) {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  try {
    if (method === "GET" && path === "/catalogue")
      return reply(200, await repository().getCatalogue());
    const guestId = path.match(/^\/guest\/([a-z0-9-]+)$/)?.[1];
    if (guestId) {
      const actor = guestActor(event.headers?.["x-guest-token"]);
      const community = new CommunityRepository(databasePool());
      if (method === "GET")
        return reply(200, await community.mine(guestId, actor));
      if (method !== "PUT" && method !== "DELETE")
        return reply(405, { error: "Method not allowed" });
      const body = event.isBase64Encoded
        ? Buffer.from(event.body ?? "", "base64").toString()
        : (event.body ?? "");
      if (Buffer.byteLength(body) > 100000)
        return reply(413, { error: "Review is too large" });
      const input = z
        .object({
          version: z.number().int().nonnegative(),
          review: z.unknown().optional(),
          website: z.string().max(0).optional(),
        })
        .parse(JSON.parse(body));
      await limitGuest(
        databasePool(),
        actor.subject,
        event.requestContext.http.sourceIp,
      );
      return reply(
        200,
        await community.save(
          guestId,
          actor,
          { ...input, displayName: "Anonymous" },
          method === "DELETE",
        ),
      );
    }
    const communityMatch = path.match(/^\/community\/([a-z0-9-]+)(\/mine)?$/);
    if (communityMatch) {
      const [, drinkId, mine] = communityMatch;
      const community = new CommunityRepository(databasePool());
      if (method === "GET" && !mine) {
        const params = event.queryStringParameters ?? {};
        const sort = z
          .enum(["newest", "highest", "lowest"])
          .parse(params.sort ?? "newest");
        const offset = z.coerce
          .number()
          .int()
          .min(0)
          .max(100000)
          .parse(params.offset ?? 0);
        return reply(200, await community.page(drinkId, sort, offset));
      }
      const identity = event.requestContext.authorizer?.lambda;
      if (!identity?.subject || !identity.issuer)
        return reply(401, { error: "Sign in to review" });
      const actor = {
        subject: identity.subject,
        issuer: identity.issuer,
        owner: identity.owner === "true",
      };
      if (method === "GET" && mine)
        return reply(200, await community.mine(drinkId, actor));
      if (mine && (method === "PUT" || method === "DELETE")) {
        const body = event.isBase64Encoded
          ? Buffer.from(event.body ?? "", "base64").toString()
          : (event.body ?? "");
        if (Buffer.byteLength(body) > 100000)
          return reply(413, { error: "Review is too large" });
        const input = z
          .object({
            version: z.number().int().nonnegative(),
            displayName: z.string().optional(),
            review: z.unknown().optional(),
          })
          .parse(JSON.parse(body));
        return reply(
          200,
          await community.save(drinkId, actor, input, method === "DELETE"),
        );
      }
      return reply(405, { error: "Method not allowed" });
    }
    if (event.requestContext.authorizer?.lambda?.owner !== "true")
      return reply(403, { error: "Editor access required" });
    if (method === "GET" && path === "/editor/reviews") {
      const catalogue = await repository().getCatalogue();
      return reply(
        200,
        catalogue.drinks.map((drink) => drink.review),
      );
    }
    const id = path.match(/^\/editor\/reviews\/([a-z0-9-]+)$/)?.[1];
    if (!id) return reply(404, { error: "Unknown route" });
    if (method === "GET") {
      // Read data and its version atomically, never with two independent queries.
      const result = await databasePool().query(
        `SELECT p.metadata,r.* FROM products p
        JOIN editorial_reviews r ON p.id=r.product_id WHERE p.id=$1`,
        [id],
      );
      if (!result.rowCount) return reply(404, { error: "Unknown drink" });
      const row = result.rows[0],
        product = productSchema.parse(row.metadata);
      const review = parseReview(
        {
          id,
          brand: product.brand,
          name: product.name,
          ...Object.fromEntries(
            ratingKeys.map((key) => [
              key,
              row[key] === null ? null : row[key] / 10,
            ]),
          ),
          notes: row.notes,
          body: row.body,
        },
        product,
      );
      return reply(200, { review, version: row.version });
    }
    if (method === "PUT") {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body ?? "", "base64").toString()
        : (event.body ?? "");
      if (Buffer.byteLength(body) > 100000)
        return reply(413, { error: "Review is too large" });
      const input = z
        .object({ version: z.number().int().positive(), review: z.unknown() })
        .parse(JSON.parse(body));
      const version = await repository().saveReview(
        id,
        input.review,
        input.version,
      );
      return reply(200, { version });
    }
    return reply(405, { error: "Method not allowed" });
  } catch (error) {
    if (error instanceof GuestError)
      return reply(error.status, { error: error.message });
    if (error instanceof CommunityNotFound)
      return reply(404, { error: "Drink or review not found" });
    if (
      error instanceof Error &&
      error.message === "Overall rating is required"
    )
      return reply(400, { error: error.message });
    if (error instanceof ReviewConflictError)
      return reply(409, { error: error.message });
    if (
      error instanceof ZodError ||
      error instanceof SyntaxError ||
      (error instanceof Error &&
        /identity|Invalid review version/.test(error.message))
    )
      return reply(400, { error: "Invalid review data" });
    // No tokens, connection strings, or review prose in logs or error responses.
    console.error(
      "Catalogue request failed",
      error instanceof Error ? error.name : "Error",
    );
    return reply(503, { error: "Storage unavailable; please try again" });
  }
}
