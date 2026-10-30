import { basePath } from "./paths";
/** Only return to this app; OAuth state must never become an external redirect. */
export function safeReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith(`${basePath}/`) ||
    /[\\\r\n]/.test(value)
  )
    return `${basePath}/editor/`;
  const url = new URL(value, "https://energy-index.invalid");
  if (
    url.origin !== "https://energy-index.invalid" ||
    !url.pathname.startsWith(`${basePath}/`) ||
    url.pathname.startsWith(`${basePath}/auth/`)
  )
    return `${basePath}/editor/`;
  return url.pathname + url.search;
}
export function requestedDrink(search: string): string | null {
  const id = new URLSearchParams(search).get("drink");
  return id && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ? id : null;
}
