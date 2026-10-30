import type { Catalogue, Review } from "@/domain/types";
import { catalogueApi } from "./community-api";

const fields = [
  "score",
  "sweetness",
  "tartness",
  "dryness",
  "energy",
  "notes",
  "body",
] as const;
export async function confirmPublication(
  expected: Review,
  read: () => Promise<Catalogue> = async () => {
    const response = await fetch(`${catalogueApi}/catalogue`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error("Catalogue unavailable");
    return response.json();
  },
  pause: () => Promise<void> = () =>
    new Promise((resolve) => setTimeout(resolve, 1000)),
): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const actual = (await read()).drinks.find(
        (drink) => drink.id === expected.id,
      )?.review;
      if (actual && fields.every((field) => actual[field] === expected[field]))
        return;
    } catch {
      // A transient read failure must not trigger a second write.
    }
    if (attempt < 5) await pause();
  }
  throw new Error(
    "Your review was saved, but we couldn't confirm it on the public catalogue yet. Click Check publication to retry without saving again.",
  );
}
