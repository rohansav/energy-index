import { CognitoJwtVerifier } from "aws-jwt-verify";
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;
/** Runs outside the VPC so verification needs no paid NAT gateway. */
export async function handler(event: { headers?: Record<string, string> }) {
  const authorization = event.headers?.authorization;
  if (!authorization?.startsWith("Bearer ") || authorization.length > 12000)
    return { isAuthorized: false };
  try {
    const token = authorization.slice(7);
    if (token.split(".").length === 3) {
      const pool = process.env.COGNITO_USER_POOL_ID;
      const client = process.env.COGNITO_CLIENT_ID;
      const owner = process.env.EDITOR_COGNITO_SUB;
      if (!pool || !client || !owner) return { isAuthorized: false };
      verifier ??= CognitoJwtVerifier.create({
        userPoolId: pool,
        clientId: client,
        tokenUse: "access",
      });
      const payload = await verifier.verify(token);
      const isAuthorized = payload.sub === owner;
      return {
        isAuthorized,
        context: { owner: isAuthorized ? "true" : "false" },
      };
    }
    if (!process.env.EDITOR_GITHUB_ID) return { isAuthorized: false };
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: authorization,
        Accept: "application/vnd.github+json",
        "User-Agent": "energy-index-editor",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { isAuthorized: false };
    const user = await response.json();
    const isAuthorized = String(user.id) === process.env.EDITOR_GITHUB_ID;
    return {
      isAuthorized,
      context: { owner: isAuthorized ? "true" : "false" },
    };
  } catch {
    return { isAuthorized: false };
  }
}
