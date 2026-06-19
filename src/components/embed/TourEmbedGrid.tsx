"use client";

import type { TourListing } from "@/types";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";

interface TourEmbedGridProps {
  tours: TourListing[];
  columns?: 2 | 3;
}

export default function TourEmbedGrid({ tours, columns = 3 }: TourEmbedGridProps) {
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
        <MarketplaceTourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
}
