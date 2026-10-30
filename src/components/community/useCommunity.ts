"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityPage } from "@/domain/community";
import { readCommunity } from "@/lib/community-api";
export function useCommunity(id: string, enabled: boolean) {
  const [data, setData] = useState<CommunityPage | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [sort, setSort] = useState("newest");
  const request = useRef(0);
  const reload = useCallback(
    async (offset = 0) => {
      const generation = ++request.current;
      setLoading(true);
      setError("");
      try {
        const next = await readCommunity(id, sort, offset);
        if (generation === request.current)
          setData((previous) =>
            offset && previous
              ? {
                  ...next,
                  reviews: [
                    ...previous.reviews,
                    ...next.reviews.filter(
                      (n) =>
                        !previous.reviews.some(
                          (p) => p.authorId === n.authorId,
                        ),
                    ),
                  ],
                }
              : next,
          );
      } catch (e) {
        if (generation === request.current) setError((e as Error).message);
      } finally {
        if (generation === request.current) setLoading(false);
      }
    },
    [id, sort],
  );
  useEffect(() => {
    if (enabled) void reload();
    return () => {
      request.current++;
    };
  }, [enabled, reload]);
  return { data, error, loading, sort, setSort, reload };
}
export type CommunityController = ReturnType<typeof useCommunity>;
