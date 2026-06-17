"use client";

import type { TourListing } from "@/types";
import TourEmbedCompactCard from "./TourEmbedCompactCard";
import TourEmbedSpotlightCard from "./TourEmbedSpotlightCard";

interface TourEmbedFeaturedLayoutProps {
  tours: TourListing[];
}

export default function TourEmbedFeaturedLayout({ tours }: TourEmbedFeaturedLayoutProps) {
  if (tours.length === 0) return null;

  const [primary, ...rest] = tours;

  if (tours.length === 1) {
    return <TourEmbedSpotlightCard tour={primary} />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TourEmbedSpotlightCard tour={primary} className="lg:min-h-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {rest.slice(0, 2).map((tour) => (
          <TourEmbedCompactCard key={tour.id} tour={tour} layout="horizontal" />
        ))}
      </div>
    </div>
  );
}
