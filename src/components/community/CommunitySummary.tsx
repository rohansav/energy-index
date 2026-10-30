import { roundedAverage } from "@/domain/community";
import type { CommunityStats } from "@/domain/community";
import { Score } from "@/components/ratings/Score";
export function CommunitySummary({
  stats,
  loading,
  error,
}: {
  stats: CommunityStats | null;
  loading: boolean;
  error: string;
}) {
  return (
    <aside className="community-box" aria-label="Community ratings">
      <div className="community-box-title">
        <h2>Community</h2>
        <span>
          {stats
            ? `${stats.count} ${stats.count === 1 ? "review" : "reviews"}`
            : loading
              ? "Loading…"
              : error
                ? "Unavailable"
                : "0 reviews"}
        </span>
      </div>
      {stats ? (
        <>
          <div className="community-average">
            <Score value={roundedAverage(stats.average)} />
            <span>Average overall</span>
          </div>
          {stats.count > 1 && (
            <>
              <div className="community-range">
                <span>
                  Lowest <b>{stats.min.toFixed(1)}</b>
                </span>
                <span>
                  Highest <b>{stats.max.toFixed(1)}</b>
                </span>
              </div>
              <div
                className="community-distribution"
                role="img"
                aria-label={`Overall distribution: ${stats.distribution.map((n, i) => `${i + 1}${i === 9 ? "" : `–${i + 1}.9`}: ${n}`).join(", ")}`}
              >
                {stats.distribution.map((count, i) => (
                  <div
                    key={i}
                    title={`${i + 1}${i === 9 ? "" : `–${i + 1}.9`}: ${count} reviews`}
                  >
                    <span
                      style={{
                        height: `${count ? Math.max(3, (count / Math.max(...stats.distribution)) * 44) : 0}px`,
                      }}
                    />
                    <small>{i + 1}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          <dl className="community-sensory">
            {Object.entries(stats.sensory).map(([key, value]) => (
              <div key={key}>
                <dt>
                  {key === "tartness"
                    ? "Sourness"
                    : key[0].toUpperCase() + key.slice(1)}
                </dt>
                <dd>
                  {value.average === null
                    ? "—"
                    : roundedAverage(value.average).toFixed(1)}
                  <small> / 5</small>
                </dd>
              </div>
            ))}
          </dl>
          <details className="community-counts">
            <summary>Category response counts</summary>
            {Object.entries(stats.sensory).map(([key, value]) => (
              <p key={key}>
                {key === "tartness" ? "Sourness" : key}: {value.count}{" "}
                {value.count === 1 ? "rating" : "ratings"}
              </p>
            ))}
          </details>
        </>
      ) : (
        <p>
          {loading
            ? "Loading community ratings…"
            : error
              ? "Community ratings could not be loaded."
              : "No community ratings yet. Be the first to review this drink."}
        </p>
      )}
      <a className="review-action" href="#community-review-form">
        Write your review ↗
      </a>
      <p className="community-footnote">
        Community scores are separate from the editor’s score.
      </p>
    </aside>
  );
}
