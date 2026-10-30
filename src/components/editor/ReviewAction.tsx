"use client";
import Link from "next/link";
import type { Review } from "@/domain/types";
import { useSession } from "@/components/auth/SessionProvider";
export function ReviewAction({ review }: { review: Review }) {
  const { isEditor } = useSession();
  if (!isEditor) return null;
  const hasReview =
    review.score !== null ||
    [review.sweetness, review.tartness, review.dryness, review.energy].some(
      (value) => value !== null,
    ) ||
    !!review.notes.trim() ||
    !!review.body.trim();
  const label = hasReview ? "Edit review" : "Add review";
  return (
    <Link
      className="review-action"
      href={`/editor/?drink=${encodeURIComponent(review.id)}`}
      aria-label={`${label} for ${review.name}`}
    >
      {label} <span aria-hidden="true">↗</span>
    </Link>
  );
}
