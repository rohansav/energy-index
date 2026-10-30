import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { guestActor } from "../src/server/guest-reviews";
import { handler } from "../src/api/handler";
test("guest secrets are hashed and invalid credentials fail before storage", async () => {
  for (const token of [undefined, "", "a".repeat(63), "g".repeat(64)])
    assert.throws(() => guestActor(token));
  const token = randomBytes(32).toString("hex");
  assert.notEqual(guestActor(token).subject, token);
  assert.equal(guestActor(token).owner, false);
  assert.deepEqual(guestActor(token), guestActor(token));
  const result = await handler({
    rawPath: "/guest/alani-blue-slush",
    headers: {},
    requestContext: { http: { method: "PUT" } },
  } as any);
  assert.equal(result.statusCode, 401);
});
