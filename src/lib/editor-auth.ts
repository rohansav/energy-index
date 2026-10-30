import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import config from "./auth-config.json";
import { safeReturnPath } from "./auth-navigation";
import { basePath } from "./paths";
let manager: UserManager | undefined;
export function editorAuth() {
  if (!manager)
    manager = new UserManager({
      authority: config.authority,
      client_id: config.clientId,
      redirect_uri: `${window.location.origin}${basePath}/auth/callback/`,
      post_logout_redirect_uri: `${window.location.origin}${basePath}/editor/`,
      response_type: "code",
      scope: "openid email profile",
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
      automaticSilentRenew: true,
      loadUserInfo: false,
    });
  return manager;
}
let refreshing: ReturnType<UserManager["signinSilent"]> | undefined;
export async function currentSession() {
  const user = await editorAuth().getUser();
  if (!user?.expired) return user;
  refreshing ??= editorAuth()
    .signinSilent()
    .finally(() => {
      refreshing = undefined;
    });
  return refreshing;
}
export function startSignIn() {
  return editorAuth().signinRedirect({
    state: {
      returnTo: safeReturnPath(
        window.location.pathname + window.location.search,
      ),
    },
  });
}
export async function signOut() {
  await editorAuth().removeUser();
  const query = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: `${window.location.origin}${basePath}/editor/`,
  });
  window.location.assign(`${config.domain}/logout?${query}`);
}
export async function editorRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const user = await currentSession();
  if (!user)
    throw new Error(
      "Please sign in to continue. Your unsaved notes are still here.",
    );
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CATALOGUE_API || "https://018z4i407i.execute-api.us-east-1.amazonaws.com"}${path}`,
    {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: {
        ...init.headers,
        Authorization: `Bearer ${user.access_token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Your session expired or this account does not have editor access. Sign in again; your unsaved notes are still here."
        : result.error || "Could not save. Please try again.",
    );
  return result;
}
