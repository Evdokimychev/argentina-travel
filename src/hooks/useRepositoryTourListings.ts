"use client";

import { useEffect, useState } from "react";
import type { TourListing } from "@/types";
import { TOURS_REPOSITORY_UPDATED_EVENT } from "@/types/tour";
import {
  getClientSyncedMarketplaceListings,
  getMarketplaceListings,
} from "@/lib/tour-repository";

export function useRepositoryTourListings(initialTours: TourListing[]): TourListing[] {
  const [tours, setTours] = useState(initialTours);

  useEffect(() => {
    setTours(getClientSyncedMarketplaceListings(initialTours));

    function refresh() {
      setTours(getMarketplaceListings());
    }

    window.addEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refresh);
  }, [initialTours]);

  return tours;
}
