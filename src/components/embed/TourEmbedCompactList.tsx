"use client";

import type { TourListing } from "@/types";
import TourEmbedCompactCard from "./TourEmbedCompactCard";
import { getTourListingReactKey } from "@/lib/tour-public-display";

interface TourEmbedCompactListProps {
  tours: TourListing[];
  matchReasons?: Record<string, string>;
}

export default function TourEmbedCompactList({ tours, matchReasons }: TourEmbedCompactListProps) {
  if (!tours.length) return null;

  return (
    <div className="grid gap-3">
      {tours.map((tour) => (
        <TourEmbedCompactCard
          key={getTourListingReactKey(tour)}
          tour={tour}
          layout="horizontal"
          matchReason={matchReasons?.[tour.slug]}
        />
      ))}
    </div>
  );
}
