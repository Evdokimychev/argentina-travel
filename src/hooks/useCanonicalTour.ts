"use client";

import { useEffect, useState } from "react";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";
import { TOURS_REPOSITORY_UPDATED_EVENT, type Tour } from "@/types/tour";

export function useCanonicalTour(slug: string, initialTour: Tour | null = null): Tour | null {
  const [tour, setTour] = useState<Tour | null>(initialTour);

  useEffect(() => {
    function refresh() {
      setTour(getCanonicalTourBySlug(slug) ?? initialTour ?? null);
    }

    refresh();
    window.addEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
  }, [slug, initialTour]);

  return tour;
}
