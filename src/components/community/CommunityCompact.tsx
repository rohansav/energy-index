import { roundedAverage } from "@/domain/community";
import type { CommunityStats } from "@/domain/community";
export function CommunityCompact({ stats }: { stats?: CommunityStats }) {
  return (
    <span className="community-compact">
      {stats
        ? `Community ${roundedAverage(stats.average).toFixed(1)} · ${stats.count} ${stats.count === 1 ? "review" : "reviews"}`
        : "Community · No ratings yet"}
    </span>
  );
}
