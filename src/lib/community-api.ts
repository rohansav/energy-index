import type { CommunityPage } from "@/domain/community";
export const catalogueApi =
  process.env.NEXT_PUBLIC_CATALOGUE_API ||
  "https://018z4i407i.execute-api.us-east-1.amazonaws.com";
export async function readCommunity(
  id: string,
  sort: string,
  offset: number,
  signal?: AbortSignal,
): Promise<CommunityPage> {
  const response = await fetch(
    `${catalogueApi}/community/${id}?sort=${sort}&offset=${offset}`,
    { cache: "no-store", signal: signal ?? AbortSignal.timeout(15000) },
  );
  if (!response.ok)
    throw new Error("Community reviews are unavailable. Please try again.");
  return response.json();
}
