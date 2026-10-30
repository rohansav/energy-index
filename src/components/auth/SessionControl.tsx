"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "./SessionProvider";
import { startSignIn, signOut } from "@/lib/editor-auth";
export function SessionControl() {
  const { loading, isEditor, signedIn } = useSession();
  const [error, setError] = useState("");
  if (loading)
    return (
      <span className="session-status" aria-live="polite">
        Checking session…
      </span>
    );
  if (isEditor)
    return (
      <Link className="session-control" href="/editor/">
        Editor <span>· Signed in</span>
      </Link>
    );
  if (signedIn)
    return (
      <span className="session-status">
        Member · Signed in{" "}
        <button className="session-control" onClick={() => void signOut()}>
          Sign out
        </button>
      </span>
    );
  return (
    <span className="session-status">
      <button
        className="session-control"
        onClick={() =>
          void startSignIn().catch(() =>
            setError("Could not start sign-in. Try again."),
          )
        }
      >
        Sign in / Join
      </button>
      {error && <span role="alert">{error}</span>}
    </span>
  );
}
