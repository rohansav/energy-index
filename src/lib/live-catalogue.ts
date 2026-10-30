"use client";
import { useEffect, useState } from "react";
import type { Catalogue } from "@/domain/types";

let inflight: Promise<Catalogue> | undefined;
function fetchCatalogue(url: string) {
  return (inflight ??= fetch(`${url}/catalogue`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Catalogue unavailable");
      return (await response.json()) as Catalogue;
    })
    .finally(() => {
      inflight = undefined;
    }));
}
/** Static HTML remains readable during outages; fresh database content replaces it on load/focus. */
export function useLiveCatalogue(initial: Catalogue): Catalogue {
  const [catalogue, setCatalogue] = useState(initial);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_CATALOGUE_API;
    if (!url) return;
    let active = true;
    const refresh = () => {
      void fetchCatalogue(url)
        .then((data) => {
          if (active) setCatalogue(data);
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return catalogue;
}
