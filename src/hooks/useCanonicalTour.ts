"use client";

import { useEffect, useState } from "react";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";
import { TOURS_REPOSITORY_UPDATED_EVENT, type Tour } from "@/types/tour";

export function useCanonicalTour(slug: string): Tour | null {
  const [tour, setTour] = useState<Tour | null>(() =>
    typeof window !== "undefined" ? getCanonicalTourBySlug(slug) ?? null : null
  );

  useEffect(() => {
    function refresh() {
      setTour(getCanonicalTourBySlug(slug) ?? null);
    }

    refresh();
    window.addEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
  }, [slug]);

  return tour;
}
