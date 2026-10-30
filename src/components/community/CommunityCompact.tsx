import { roundedAverage } from "@/domain/community";
import type { CommunityStats } from "@/domain/community";
import { scoreColor } from "@/domain/ratings";
export function CommunityCompact({ stats }: { stats?: CommunityStats }) {
  const rated = stats && stats.count > 0;
  return (
    <span className={`community-compact${rated ? " has-ratings" : ""}`}>
      <span>Community</span>{" "}
      {rated ? (
        <>
          <strong style={{ color: scoreColor(stats.average) }}>
            {roundedAverage(stats.average).toFixed(1)}
          </strong>
          <span>
            {" "}
            / 10 · {stats.count} {stats.count === 1 ? "review" : "reviews"}
          </span>
        </>
      ) : (
        <span>· No ratings yet</span>
      )}
    </span>
  );
}
