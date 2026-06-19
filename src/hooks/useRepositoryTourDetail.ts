"use client";

import { useEffect, useState } from "react";
import type { TourDetail } from "@/types";
import { TOURS_REPOSITORY_UPDATED_EVENT } from "@/types/tour";
import { getRepositoryTourDetail } from "@/lib/tour-repository";

export function useRepositoryTourDetail(
  slug: string,
  initialTour?: TourDetail | null
): TourDetail | null {
  const [localOverride, setLocalOverride] = useState<TourDetail | null>(null);
  const [localSlug, setLocalSlug] = useState(slug);

  useEffect(() => {
    function readAccessToken(): string | null {
      return new URLSearchParams(window.location.search).get("access");
    }

    function resolveLocal(): TourDetail | null {
      return getRepositoryTourDetail(slug, readAccessToken()) ?? null;
    }

    setLocalSlug(slug);
    setLocalOverride(resolveLocal());

    function refresh() {
      setLocalOverride(resolveLocal());
    }

    window.addEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
  }, [slug, initialTour]);

  // При client-side переходе между турами сразу показываем новый SSR-снимок,
  // не дожидаясь useEffect — иначе на экране остаётся контент предыдущего тура.
  if (localOverride && localSlug === slug) {
    return localOverride;
  }

  return initialTour ?? null;
}
