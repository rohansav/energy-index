"use client";
import { useEffect, useState } from "react";
import { editorAuth } from "@/lib/editor-auth";
import type { User } from "oidc-client-ts";
import { safeReturnPath } from "@/lib/auth-navigation";
import { basePath } from "@/lib/paths";
let callback: Promise<User> | undefined;
export function AuthCallback() {
  const [error, setError] = useState("");
  useEffect(() => {
    callback ??= editorAuth().signinRedirectCallback();
    callback
      .then((user) =>
        window.location.replace(
          safeReturnPath(
            (user.state as { returnTo?: unknown } | undefined)?.returnTo,
          ),
        ),
      )
      .catch(() =>
        setError(
          "Sign-in could not finish. Please return to the editor and try again.",
        ),
      );
  }, []);
  return (
    <section className="editor-intro">
      <h1>{error ? "Sign-in interrupted" : "Signing you in…"}</h1>
      <p role="status">{error || "Returning to your drink reviews."}</p>
      {error && <a href={`${basePath}/editor/`}>Return to editor</a>}
    </section>
  );
}
