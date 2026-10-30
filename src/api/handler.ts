import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import { z, ZodError } from "zod";
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
  event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ owner: string }>,
) {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  try {
    if (method === "GET" && path === "/catalogue")
      return reply(200, await repository().getCatalogue());
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
