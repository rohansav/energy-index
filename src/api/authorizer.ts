/** Runs outside the VPC so GitHub verification needs no paid NAT gateway. */
export async function handler(event: { headers?: Record<string, string> }) {
  const authorization = event.headers?.authorization;
  if (!authorization?.startsWith("Bearer ") || authorization.length > 1000)
    return { isAuthorized: false };
  try {
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
