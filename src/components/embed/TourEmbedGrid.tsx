"use client";

import type { TourListing } from "@/types";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import { getTourListingReactKey } from "@/lib/tour-public-display";
import TourEmbedMatchReason from "./TourEmbedMatchReason";

interface TourEmbedGridProps {
  tours: TourListing[];
  columns?: 2 | 3;
  matchReasons?: Record<string, string>;
}

export default function TourEmbedGrid({ tours, columns = 3, matchReasons }: TourEmbedGridProps) {
  if (!tours.length) return null;

  return (
    <div
      className={
        columns === 2
          ? "grid gap-5 sm:grid-cols-2"
          : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {tours.map((tour) => (
        <div key={getTourListingReactKey(tour)} className="flex min-w-0 flex-col">
          <MarketplaceTourCard tour={tour} />
          <TourEmbedMatchReason
            reason={matchReasons?.[tour.slug]}
            className="mx-1 mt-2 rounded-xl bg-sky/5 px-3 py-2"
          />
        </div>
      ))}
    </div>
  );
}
