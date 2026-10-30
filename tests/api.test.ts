import { test } from "node:test";
import assert from "node:assert/strict";
import { handler as authorize } from "../src/api/authorizer";
import { handler } from "../src/api/handler";
import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";

test("editor API denies writes without trusted API Gateway authorization", async () => {
  const event = {
    rawPath: "/editor/reviews/alani-blue-slush",
    body: "{}",
    requestContext: { http: { method: "PUT" } },
  };
  const result = await handler(
    event as APIGatewayProxyEventV2WithLambdaAuthorizer<{ owner: string }>,
  );
  assert.equal(result.statusCode, 403);
});

test("GitHub authorizer fails closed for missing, invalid and non-owner credentials", async () => {
  const original = globalThis.fetch;
  const previous = process.env.EDITOR_GITHUB_ID;
  process.env.EDITOR_GITHUB_ID = "123";
  try {
    assert.equal((await authorize({})).isAuthorized, false);
    globalThis.fetch = async () => new Response("{}", { status: 401 });
    assert.equal(
      (await authorize({ headers: { authorization: "Bearer test" } }))
        .isAuthorized,
      false,
    );
    globalThis.fetch = async () =>
      Response.json({ id: 999, login: "rohansav" });
    assert.equal(
      (await authorize({ headers: { authorization: "Bearer test" } }))
        .isAuthorized,
      false,
    );
    globalThis.fetch = async () => Response.json({ id: 123 });
    assert.equal(
      (await authorize({ headers: { authorization: "Bearer test" } }))
        .isAuthorized,
      true,
    );
    globalThis.fetch = async () => {
      throw new Error("outage");
    };
    assert.equal(
      (await authorize({ headers: { authorization: "Bearer test" } }))
        .isAuthorized,
      false,
    );
  } finally {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.EDITOR_GITHUB_ID;
    else process.env.EDITOR_GITHUB_ID = previous;
  }
});
