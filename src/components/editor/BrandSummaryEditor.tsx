"use client";
import { useEffect, useState } from "react";
import { editorRequest } from "@/lib/editor-auth";
import { catalogueApi } from "@/lib/community-api";
import type { Catalogue } from "@/domain/types";

type Entry = { name: string; summary: string; version: number };
export function BrandSummaryEditor() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);
  const entry = entries.find((item) => item.name === name);
  const value = drafts[name] ?? entry?.summary ?? "";
  const dirty = entries.some(
    (item) =>
      drafts[item.name] !== undefined && drafts[item.name] !== item.summary,
  );
  useEffect(() => {
    editorRequest<Entry[]>("/editor/brands")
      .then((items) => {
        setEntries(items);
        setName(items[0]?.name ?? "");
      })
      .catch((e) => setError(e.message));
  }, []);
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
  async function publish() {
    if (!entry || busy) return;
    setBusy(true);
    setError("");
    setStatus("Publishing…");
    setPublished(false);
    try {
      const saved = await editorRequest<{ summary: string; version: number }>(
        "/editor/brands",
        {
          method: "PUT",
          body: JSON.stringify({
            name,
            summary: value,
            version: entry.version,
          }),
        },
      );
      setEntries((items) =>
        items.map((item) =>
          item.name === name ? { ...item, ...saved } : item,
        ),
      );
      setDrafts((items) => ({ ...items, [name]: saved.summary }));
      let confirmed = false;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const response = await fetch(`${catalogueApi}/catalogue`, {
            cache: "no-store",
            signal: AbortSignal.timeout(4000),
          });
          if (response.ok) {
            const data: Catalogue = await response.json();
            if (
              (data.brands.find((b) => b.name === name)?.summary ?? "") ===
              saved.summary
            ) {
              confirmed = true;
              break;
            }
          }
        } catch {
          /* Retry public reads without repeating the write. */
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!confirmed) {
        setStatus(
          "Saved. Public confirmation is delayed; refresh the brand page to check.",
        );
        return;
      }
      setPublished(true);
      setStatus("Published. Your brand summary is live.");
      window.dispatchEvent(new Event("catalogue-refresh"));
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="brand-summary-editor">
      <summary>Brand summaries</summary>
      <p>
        Write a short introduction to what each brand offers energy drink fans.
        It appears below the brand header and on its catalogue card.
      </p>
      {error && (
        <p role="alert" className="editor-error">
          {error}
        </p>
      )}
      <fieldset disabled={busy || !entry} className="editor-fields">
        <label>
          Brand
          <select
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setStatus("");
              setPublished(false);
            }}
          >
            {entries.map((item) => (
              <option key={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Brand summary
          <textarea
            rows={5}
            maxLength={1200}
            value={value}
            onChange={(e) => {
              setDrafts((items) => ({ ...items, [name]: e.target.value }));
              setPublished(false);
              setStatus("");
            }}
            placeholder="Who is this brand for? What stands out about its flavors, range, or style?"
          />
        </label>
        <p className="editor-help">
          {value.length} / 1,200 characters · Leave blank to hide this section.
        </p>
        <button
          type="button"
          className={`editor-primary ${published ? "brand-summary-published" : ""}`}
          onClick={() => void publish()}
        >
          {busy
            ? "Publishing…"
            : published
              ? "✓ Published"
              : "Publish brand summary"}
        </button>
      </fieldset>
      <p role="status">{status}</p>
    </details>
  );
}
