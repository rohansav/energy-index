import type { Drink } from "@/domain/types";
import type { CommunityController } from "./useCommunity";
import { CommunityForm } from "./CommunityForm";
import { Score } from "@/components/ratings/Score";
import { ReviewText } from "@/components/drinks/ReviewText";
export function CommunityReviews({
  drink,
  community,
}: {
  drink: Drink;
  community: CommunityController;
}) {
  const { data, sort, setSort, loading, error, reload } = community;
  return (
    <section className="community-section">
      <div className="community-list-heading">
        <div>
          <p className="eyebrow">THE COMMUNITY</p>
          <h2>Reviews{data?.stats ? ` (${data.stats.count})` : ""}</h2>
        </div>
        <label>
          Sort reviews
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </label>
      </div>
      {error && (
        <p role="alert">
          {error} <button onClick={() => void reload()}>Try again</button>
        </p>
      )}
      {data?.reviews.map((entry) => (
        <article className="community-review" key={entry.authorId}>
          <div className="community-review-heading">
            <div>
              <strong>{entry.displayName}</strong>
              <time dateTime={entry.updatedAt}>
                {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </div>
            <Score value={entry.review.score} compact />
          </div>
          {entry.review.notes && (
            <p className="community-review-summary">{entry.review.notes}</p>
          )}
          <ReviewText text={entry.review.body} />
          <div className="community-review-ratings">
            {(["sweetness", "tartness", "dryness", "energy"] as const)
              .filter((key) => entry.review[key] !== null)
              .map((key) => (
                <span key={key}>
                  {key === "tartness"
                    ? "Sourness"
                    : key[0].toUpperCase() + key.slice(1)}{" "}
                  {entry.review[key]!.toFixed(1)}/5
                </span>
              ))}
          </div>
        </article>
      ))}
      {!loading && !error && data?.reviews.length === 0 && (
        <p className="community-empty">No community reviews yet.</p>
      )}
      {data?.nextOffset !== null && data?.nextOffset !== undefined && (
        <button
          className="review-action"
          disabled={loading}
          onClick={() => void reload(data.nextOffset!)}
        >
          {loading ? "Loading…" : "Load more reviews"}
        </button>
      )}
      <CommunityForm drink={drink} onSaved={() => reload()} />
    </section>
  );
}
