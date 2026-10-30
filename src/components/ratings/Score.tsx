import type { CSSProperties } from "react";
import type { Rating } from "@/domain/types";
import { formatRating, scoreColor, scoreDescription } from "@/domain/ratings";

type Props = { value: Rating; compact?: boolean };
export function Score({ value, compact = false }: Props) {
  const style =
    value === null
      ? undefined
      : ({ "--score-color": scoreColor(value) } as CSSProperties);
  const title = value === null ? "Not reviewed" : scoreDescription(value);
  if (compact)
    return (
      <span
        className={`compact-score${value === null ? " is-unrated" : ""}`}
        style={style}
        title={title}
      >
        {formatRating(value)}
        {value !== null && <small>/ 10</small>}
      </span>
    );
  return (
    <div
      className={`excerpt-rating${value === null ? " unrated" : ""}`}
      style={style}
      title={title}
    >
      <span>OVERALL</span>
      <strong>{formatRating(value)}</strong>
      <span>{value === null ? "NOT REVIEWED" : "OUT OF 10"}</span>
    </div>
  );
}
