import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { createSessionVerifier } from "../src/api/authorizer";

test("Cognito sessions verify members and reject wrong client, issuer, token use, expiry and signature", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const pool = "us-east-1_TestPool",
    client = "test-client",
    owner = "editor-sub";
  const verifier = createSessionVerifier(pool, client);
  verifier.cacheJwks({
    keys: [
      {
        ...publicKey.export({ format: "jwk" }),
        kid: "test-key",
        alg: "RS256",
        use: "sig",
      } as any,
    ],
  });
  const claims = {
    iss: `https://cognito-idp.us-east-1.amazonaws.com/${pool}`,
    sub: owner,
    client_id: client,
    token_use: "access",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const jwt = (changes: Record<string, unknown> = {}) => {
    const head = Buffer.from(
      JSON.stringify({ alg: "RS256", kid: "test-key" }),
    ).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({ ...claims, ...changes }),
    ).toString("base64url");
    return `${head}.${body}.${sign("RSA-SHA256", Buffer.from(`${head}.${body}`), privateKey).toString("base64url")}`;
  };
  assert.equal((await verifier.verify(jwt())).sub, owner);
  assert.equal(
    (await verifier.verify(jwt({ sub: "community-member" }))).sub,
    "community-member",
  );
  for (const invalid of [
    { client_id: "wrong-client" },
    { iss: "https://example.com" },
    { token_use: "id", aud: client },
    { exp: 1 },
  ])
    await assert.rejects(() => verifier.verify(jwt(invalid)));
  const forged = jwt().split(".");
  forged[1] = Buffer.from(
    JSON.stringify({ ...claims, sub: "forged" }),
  ).toString("base64url");
  await assert.rejects(() => verifier.verify(forged.join(".")));
});
