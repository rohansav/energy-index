"use client";
import { useEffect, useState } from "react";
import type { Review } from "@/domain/types";
import { editorAuth, editorRequest, signOut } from "@/lib/editor-auth";
import { basePath } from "@/lib/paths";
import { ReviewForm } from "./ReviewForm";
export function Editor() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [accountId, setAccountId] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [filter, setFilter] = useState("all");
  const [review, setReview] = useState<Review | null>(null);
  const [original, setOriginal] = useState("");
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = !!review && JSON.stringify(review) !== original;
  const loadList = () =>
    editorRequest<Review[]>("/editor/reviews").then(setReviews);
  useEffect(() => {
    editorAuth()
      .getUser()
      .then(async (user) => {
        if (user?.expired) user = await editorAuth().signinSilent();
        setSignedIn(!!user);
        if (user) {
          await loadList();
          setAccountId(user.profile.sub);
          const saved = sessionStorage.getItem(
            `editor-draft:${user.profile.sub}`,
          );
          if (saved) {
            try {
              const draft = JSON.parse(saved);
              if (
                draft.review?.id &&
                Number.isInteger(draft.version) &&
                typeof draft.original === "string"
              ) {
                setReview(draft.review);
                setOriginal(draft.original);
                setVersion(draft.version);
                setMessage("Restored your unpublished draft from this tab.");
              }
            } catch {
              sessionStorage.removeItem(`editor-draft:${user.profile.sub}`);
            }
          }
        }
      })
      .catch((e) => {
        setSignedIn(false);
        setError(e.message);
      });
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!accountId) return;
    try {
      if (dirty)
        sessionStorage.setItem(
          `editor-draft:${accountId}`,
          JSON.stringify({ review, original, version }),
        );
      else sessionStorage.removeItem(`editor-draft:${accountId}`);
    } catch {
      /* The in-memory form still works if browser storage is full. */
    }
  }, [accountId, dirty, review, original, version]);
  async function select(id: string) {
    if (
      dirty &&
      !window.confirm("Discard your unsaved changes and open another drink?")
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await editorRequest<{ review: Review; version: number }>(
        `/editor/reviews/${id}`,
      );
      setReview(data.review);
      setOriginal(JSON.stringify(data.review));
      setVersion(data.version);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (!review) return;
    setBusy(true);
    setError("");
    setMessage("");
    const normalized = {
      ...review,
      notes: review.notes.trim(),
      body: review.body.trim(),
    };
    try {
      const result = await editorRequest<{ version: number }>(
        `/editor/reviews/${review.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ review: normalized, version }),
        },
      );
      setVersion(result.version);
      setReview(normalized);
      setOriginal(JSON.stringify(normalized));
      setReviews((items) =>
        items.map((r) => (r.id === normalized.id ? normalized : r)),
      );
      setMessage("Published. Your ratings and notes are live.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const visible = reviews
    .filter(
      (r) =>
        (!brand || r.brand === brand) &&
        `${r.brand} ${r.name}`.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" ||
          (filter === "rated" ? r.score !== null : r.score === null)),
    )
    .sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
    );
  return (
    <section className="editor-page">
      <div className="editor-intro">
        <div>
          <p className="editor-eyebrow">YOUR TASTING NOTEBOOK</p>
          <h1>Review editor</h1>
          <p>Choose a drink, record your ratings, and publish.</p>
        </div>
        {signedIn && (
          <button
            disabled={busy}
            onClick={() => {
              if (
                !dirty ||
                window.confirm("Discard unsaved changes and sign out?")
              ) {
                sessionStorage.removeItem(`editor-draft:${accountId}`);
                void signOut();
              }
            }}
          >
            Sign out
          </button>
        )}
      </div>
      {error && (
        <div className="editor-error" role="alert">
          {error}{" "}
          <button onClick={() => void editorAuth().signinRedirect()}>
            Sign in again
          </button>
        </div>
      )}
      {signedIn === null ? (
        <p role="status">Checking your session…</p>
      ) : !signedIn ? (
        <div className="editor-login">
          <h2>Your reviews, all in one place.</h2>
          <p>Sign in with your editor account to update ratings and notes.</p>
          <button
            className="editor-primary"
            onClick={() =>
              void editorAuth()
                .signinRedirect()
                .catch((e) => setError(e.message))
            }
          >
            Sign in
          </button>
        </div>
      ) : (
        <div className="editor-workspace">
          <aside className="editor-picker" aria-label="Choose a drink">
            <label>
              Search drinks
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or brand"
              />
            </label>
            <div className="editor-filters">
              <label>
                Brand
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="">All brands</option>
                  {Array.from(new Set(reviews.map((r) => r.brand)))
                    .sort()
                    .map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                </select>
              </label>
              <label>
                Rating status
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All drinks</option>
                  <option value="rated">Rated</option>
                  <option value="unrated">Unrated</option>
                </select>
              </label>
            </div>
            <p className="editor-help">
              {visible.length} drinks · Rated means Overall has a score
            </p>
            <div className="editor-drinks">
              {visible.map((r) => (
                <button
                  disabled={busy}
                  aria-pressed={review?.id === r.id}
                  key={r.id}
                  onClick={() => void select(r.id)}
                >
                  <span>
                    <small>{r.brand}</small>
                    {r.name}
                  </span>
                  <strong>{r.score === null ? "—" : r.score.toFixed(1)}</strong>
                </button>
              ))}
              {reviews.length > 0 && visible.length === 0 && (
                <p>No drinks match these filters.</p>
              )}
            </div>
          </aside>
          <div className="editor-review">
            {review ? (
              <>
                <div className="editor-review-heading">
                  <div>
                    <p className="editor-eyebrow">{review.brand}</p>
                    <h2>{review.name}</h2>
                  </div>
                  <a
                    href={`${basePath}/drinks/${review.id}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View drink ↗
                  </a>
                </div>
                <p role="status" className="editor-status">
                  {busy ? "Working…" : message}
                </p>
                <ReviewForm
                  review={review}
                  onChange={setReview}
                  onPublish={() => void publish()}
                  busy={busy}
                  dirty={dirty}
                />
              </>
            ) : (
              <div className="editor-empty">
                <h2>Select a drink to begin</h2>
                <p>Your existing ratings and notes will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
