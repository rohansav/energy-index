"use client";
import {
  createGuestCredential,
  hasGuestCredential,
  guestRequest,
} from "@/lib/guest-auth";
import { reviewSchema } from "@/server/validation";
import { useEffect, useState } from "react";
import type { Drink, Review } from "@/domain/types";
import type { OwnCommunityReview } from "@/domain/community";
import { useSession } from "@/components/auth/SessionProvider";
import { editorRequest, startSignIn } from "@/lib/editor-auth";
import { ReviewForm } from "@/components/editor/ReviewForm";
const blank = (drink: Drink): Review => ({
  id: drink.id,
  brand: drink.brand,
  name: drink.name,
  score: null,
  sweetness: null,
  tartness: null,
  dryness: null,
  energy: null,
  notes: "",
  body: "",
});
export function CommunityForm({
  drink,
  onSaved,
}: {
  drink: Drink;
  onSaved: () => Promise<unknown>;
}) {
  const { signedIn, loading, subject } = useSession();
  const [guest, setGuest] = useState(false);
  const [website, setWebsite] = useState("");
  const isGuest = guest && !signedIn;
  const canReview = signedIn || isGuest;
  const request = isGuest ? guestRequest : editorRequest;
  const endpoint = isGuest
    ? `/guest/${drink.id}`
    : `/community/${drink.id}/mine`;
  useEffect(() => {
    if (hasGuestCredential()) setGuest(true);
  }, []);
  const [review, setReview] = useState(() => blank(drink)),
    [name, setName] = useState(""),
    [version, setVersion] = useState(0),
    [exists, setExists] = useState(false),
    [original, setOriginal] = useState(""),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const dirty = ready && JSON.stringify({ review, name }) !== original;
  const draftKey = `community-draft:${isGuest ? "guest" : subject}:${drink.id}`;
  async function load(restore = false) {
    setReady(false);
    setError("");
    try {
      const own = await request<OwnCommunityReview>(endpoint);
      const r = own.review ?? blank(drink);
      setReview(r);
      setName(isGuest ? "Anonymous" : own.displayName);
      setVersion(own.version);
      setExists(!!own.review);
      setOriginal(
        JSON.stringify({
          review: r,
          name: isGuest ? "Anonymous" : own.displayName,
        }),
      );
      if (restore) {
        try {
          const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? "null");
          if (
            saved &&
            saved.version === own.version &&
            saved.review?.id === drink.id &&
            typeof saved.name === "string"
          ) {
            const parsed = reviewSchema.safeParse(saved.review);
            if (parsed.success) {
              setReview(parsed.data);
              setName(saved.name);
              setMessage("Restored your unpublished draft from this tab.");
            }
          } else if (saved)
            setMessage(
              "A newer review is available. Your older draft was not applied.",
            );
        } catch {
          /* Invalid browser drafts do not affect published reviews. */
        }
      }
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!loading && canReview) void load(true);
    else setReady(false);
  }, [signedIn, subject, drink.id, isGuest, loading]);
  useEffect(() => {
    if (!ready || !canReview) return;
    try {
      if (dirty)
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ review, name, version }),
        );
      else sessionStorage.removeItem(draftKey);
    } catch {
      /* In-memory edits still work when storage is full. */
    }
  }, [ready, canReview, dirty, draftKey, review, name, version]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save(remove = false) {
    if (!remove && (review.score === null || name.trim().length < 2)) {
      setError(
        "Choose an Overall rating and a public display name (2–40 characters).",
      );
      return;
    }
    if (
      remove &&
      !window.confirm(
        "Delete your community review? It will no longer count toward community ratings.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request(endpoint, {
        method: remove ? "DELETE" : "PUT",
        body: JSON.stringify({
          version,
          displayName: name.trim(),
          review,
          website,
        }),
      });
      setMessage(
        remove
          ? "Your community review was deleted."
          : "Your community review is published.",
      );
      await load();
      await onSaved();
      window.dispatchEvent(new Event("catalogue-refresh"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="community-review-form" className="community-form editor-page">
      <h3>{exists ? "Your community review" : "Write a community review"}</h3>
      {loading ? (
        <p>Checking your session…</p>
      ) : !canReview ? (
        <>
          <p>No account needed. Guest reviews are published as Anonymous.</p>
          <button
            className="editor-primary"
            onClick={() => {
              try {
                createGuestCredential();
                setGuest(true);
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Review as a guest
          </button>
          <button
            className="editor-primary"
            onClick={() => void startSignIn().catch((e) => setError(e.message))}
          >
            Sign in / Create account
          </button>
        </>
      ) : (
        <>
          {ready ? (
            <>
              <p>
                {isGuest
                  ? "Published as Anonymous. Edit or delete from this browser; clearing browser data loses that access."
                  : "One review per account. Your review publishes immediately."}
              </p>
              {isGuest && (
                <label className="guest-honeypot" aria-hidden="true">
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              )}
              {!isGuest && (
                <label>
                  Public display name
                  <input
                    maxLength={40}
                    minLength={2}
                    value={name}
                    disabled={busy}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="nickname"
                  />
                  <small>
                    Shown with your reviews. Your email stays private.
                  </small>
                </label>
              )}
              <ReviewForm
                review={review}
                onChange={setReview}
                onPublish={() => void save()}
                busy={busy}
                dirty={dirty}
                requiredOverall
              />
              {exists && (
                <button
                  className="community-delete"
                  disabled={busy}
                  onClick={() => void save(true)}
                >
                  Delete my review
                </button>
              )}
            </>
          ) : (
            <p>
              {error ? "Unable to load your review." : "Loading your review…"}
            </p>
          )}
        </>
      )}
      {error && (
        <div role="alert" className="editor-error">
          {error}
          {canReview && (
            <button
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm(
                    "Discard unsaved edits and reload your review?",
                  )
                )
                  void load();
              }}
            >
              Reload my review
            </button>
          )}
        </div>
      )}
      {message && (
        <p role="status" className="editor-status">
          {message}
        </p>
      )}
    </section>
  );
}
