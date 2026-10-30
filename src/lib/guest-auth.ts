import { catalogueApi } from "./community-api";
const key = "energy-index-guest-v1";
export function hasGuestCredential() {
  try {
    return /^[a-f0-9]{64}$/.test(localStorage.getItem(key) ?? "");
  } catch {
    return false;
  }
}
export function createGuestCredential() {
  if (hasGuestCredential()) return;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  try {
    localStorage.setItem(key, token);
  } catch {
    throw new Error(
      "Allow browser storage to review as a guest, or sign in instead.",
    );
  }
}
export async function guestRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(key);
  if (!token)
    throw new Error("Your guest session is missing. Reload to start again.");
  const response = await fetch(`${catalogueApi}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
    headers: { "Content-Type": "application/json", "X-Guest-Token": token },
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Could not save. Please try again.");
  return result;
}
