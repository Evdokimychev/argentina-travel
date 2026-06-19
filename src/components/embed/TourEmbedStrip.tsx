"use client";

import type { TourListing } from "@/types";
import TourEmbedCompactCard from "./TourEmbedCompactCard";

interface TourEmbedStripProps {
  tours: TourListing[];
}

export default function TourEmbedStrip({ tours }: TourEmbedStripProps) {
  if (!tours.length) return null;

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
      <div className="flex snap-x snap-mandatory gap-4">
        {tours.map((tour) => (
          <TourEmbedCompactCard key={tour.id} tour={tour} layout="vertical" />
        ))}
      </div>
    </div>
  );
}
