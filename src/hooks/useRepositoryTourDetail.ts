"use client";

import { useEffect, useState } from "react";
import type { TourDetail } from "@/types";
import { TOURS_REPOSITORY_UPDATED_EVENT } from "@/types/tour";
import { getRepositoryTourDetail } from "@/lib/tour-repository";

export function useRepositoryTourDetail(
  slug: string,
  initialTour?: TourDetail | null
): TourDetail | null {
  const [tour, setTour] = useState<TourDetail | null>(initialTour ?? null);

  useEffect(() => {
    const synced = getRepositoryTourDetail(slug);
    setTour(synced ?? initialTour ?? null);

    function refresh() {
      setTour(getRepositoryTourDetail(slug) ?? initialTour ?? null);
    }

    window.addEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
  }, [slug, initialTour]);

  return tour;
}
