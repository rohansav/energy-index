"use client";
import { useEffect, useState } from "react";
import { editorAuth } from "@/lib/editor-auth";
import { basePath } from "@/lib/paths";
let callback: Promise<unknown> | undefined;
export function AuthCallback() {
  const [error, setError] = useState("");
  useEffect(() => {
    callback ??= editorAuth().signinRedirectCallback();
    callback
      .then(() => window.location.replace(`${basePath}/editor/`))
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
