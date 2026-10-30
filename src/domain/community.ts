import type { RatingKey, Review } from "./types";
export type SensoryKey = Exclude<RatingKey, "score">;
export interface CommunityStats {
  count: number;
  average: number;
  min: number;
  max: number;
  distribution: number[];
  sensory: Record<SensoryKey, { average: number | null; count: number }>;
}
export interface CommunityEntry {
  authorId: string;
  displayName: string;
  review: Review;
  createdAt: string;
  updatedAt: string;
}
export interface CommunityPage {
  stats: CommunityStats | null;
  reviews: CommunityEntry[];
  nextOffset: number | null;
}
export interface OwnCommunityReview {
  review: Review | null;
  version: number;
  displayName: string;
}

/** Round only at display time; stored aggregates retain their full precision. */
export const roundedAverage = (value: number) =>
  Math.round((value + Number.EPSILON) * 10) / 10;
