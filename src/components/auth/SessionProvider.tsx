"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "oidc-client-ts";
import { editorAuth, currentSession } from "@/lib/editor-auth";
import config from "@/lib/auth-config.json";
const SessionContext = createContext<{
  loading: boolean;
  isEditor: boolean;
  signedIn: boolean;
  subject: string | null;
}>({
  loading: true,
  isEditor: false,
  signedIn: false,
  subject: null,
});
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const accept = (next: User | null) => {
      if (active) {
        setUser(next);
        setLoading(false);
      }
    };
    const clear = () => accept(null);
    const refresh = () => {
      void currentSession().then(accept).catch(clear);
    };
    const auth = editorAuth();
    auth.events.addUserLoaded(accept);
    auth.events.addUserUnloaded(clear);
    auth.events.addAccessTokenExpired(refresh);
    auth.events.addSilentRenewError(clear);
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      auth.events.removeUserLoaded(accept);
      auth.events.removeUserUnloaded(clear);
      auth.events.removeAccessTokenExpired(refresh);
      auth.events.removeSilentRenewError(clear);
    };
  }, []);
  return (
    <SessionContext.Provider
      value={{
        loading,
        signedIn: !!user,
        subject: user?.profile.sub ?? null,
        isEditor: !!user && user.profile.sub === config.editorSub,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export const useSession = () => useContext(SessionContext);
