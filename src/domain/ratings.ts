import type { Rating, RatingKey, Review } from "./types";

export const ratingFields: ReadonlyArray<{
  key: RatingKey;
  label: string;
  min: number;
  max: number;
}> = [
  { key: "score", label: "Overall", min: 1, max: 10 },
  { key: "sweetness", label: "Sweetness", min: 0, max: 5 },
  { key: "tartness", label: "Sourness", min: 0, max: 5 },
  { key: "dryness", label: "Dryness", min: 0, max: 5 },
  { key: "energy", label: "Energy", min: 0, max: 5 },
];
export const scoreBands = [
  { min: 10, range: "10.0", label: "The benchmark" },
  { min: 9, range: "9.0–9.9", label: "Exceptional; a favorite" },
  { min: 7, range: "7.0–8.9", label: "Good; would buy again" },
  { min: 5, range: "5.0–6.9", label: "Acceptable; little reason to choose it" },
  { min: 3, range: "3.0–4.9", label: "Actively unpleasant" },
  { min: 1, range: "1.0–2.9", label: "Extremely unpleasant" },
] as const;
export function isRated(review: Pick<Review, "score">): boolean {
  return (
    review.score !== null &&
    Number.isFinite(review.score) &&
    review.score >= 1 &&
    review.score <= 10
  );
}
export function formatRating(value: Rating): string {
  return value === null ? "Unrated" : value.toFixed(1);
}
export function scoreDescription(score: number): string {
  return scoreBands.find((band) => score >= band.min)?.label ?? "Unrated";
}
/** User-defined color stops; interpolate smoothly between them. */
export function scoreColor(score: number): string {
  const stops = [
    [4, 0, 78, 42],
    [5, 20, 85, 36],
    [6, 32, 88, 41],
    [7, 50, 85, 37],
    [8, 72, 75, 35],
    [9, 105, 65, 34],
    [10, 135, 70, 30],
  ];
  const value = Math.max(4, Math.min(10, score));
  const index = Math.min(stops.length - 2, Math.floor(value) - 4);
  const low = stops[index],
    high = stops[index + 1],
    amount = value - low[0];
  const [hue, saturation, lightness] = low
    .slice(1)
    .map((channel, i) => channel + (high[i + 1] - channel) * amount);
  return `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`;
}
