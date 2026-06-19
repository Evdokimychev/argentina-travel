"use client";

import type { TourListing } from "@/types";
import TourEmbedCompactCard from "./TourEmbedCompactCard";

interface TourEmbedCompactListProps {
  tours: TourListing[];
}

export default function TourEmbedCompactList({ tours }: TourEmbedCompactListProps) {
  if (!tours.length) return null;

  return (
    <div className="grid gap-3">
      {tours.map((tour) => (
        <TourEmbedCompactCard key={tour.id} tour={tour} layout="horizontal" />
      ))}
    </div>
  );
}
