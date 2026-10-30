"use client";
import type { RatingKey, Review } from "@/domain/types";
export const fields: {
  key: RatingKey;
  label: string;
  min: number;
  max: number;
}[] = [
  { key: "score", label: "Overall", min: 1, max: 10 },
  { key: "sweetness", label: "Sweetness", min: 0, max: 5 },
  { key: "tartness", label: "Sourness", min: 0, max: 5 },
  { key: "dryness", label: "Dryness", min: 0, max: 5 },
  { key: "energy", label: "Energy", min: 0, max: 5 },
];
export function ReviewForm({
  review,
  onChange,
  onPublish,
  busy,
  dirty,
}: {
  review: Review;
  onChange: (review: Review) => void;
  onPublish: () => void;
  busy: boolean;
  dirty: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onPublish();
      }}
    >
      <fieldset disabled={busy} className="editor-fields">
        <legend className="sr-only">Review ratings and notes</legend>
        <div className="editor-ratings">
          {fields.map(({ key, label, min, max }) => (
            <label key={key}>
              {label}
              <select
                value={review[key] ?? ""}
                onChange={(e) =>
                  onChange({
                    ...review,
                    [key]:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              >
                <option value="">Not rated</option>
                {Array.from(
                  { length: (max - min) * 10 + 1 },
                  (_, i) => min + i / 10,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n.toFixed(1)}
                  </option>
                ))}
              </select>
              <small>
                {min}–{max} · steps of 0.1
              </small>
            </label>
          ))}
        </div>
        <p className="editor-help">
          Overall is your subjective verdict. The other ratings describe
          sweetness, sourness, dryness, and perceived energy.
        </p>
        <label>
          Short summary
          <textarea
            rows={2}
            maxLength={300}
            value={review.notes}
            onChange={(e) => onChange({ ...review, notes: e.target.value })}
          />
          <small>{review.notes.length}/300 · Shown under the drink name</small>
        </label>
        <label>
          Your notes
          <textarea
            rows={10}
            maxLength={20000}
            value={review.body}
            onChange={(e) => onChange({ ...review, body: e.target.value })}
            placeholder="Flavor, impressions, and anything worth remembering…"
          />
          <small>Plain text · optional</small>
        </label>
        <div className="editor-publish">
          <span>{dirty ? "Unsaved changes" : "Up to date"}</span>
          <button
            className="editor-primary"
            type="submit"
            disabled={busy || !dirty}
          >
            {busy ? "Publishing…" : "Publish review"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
