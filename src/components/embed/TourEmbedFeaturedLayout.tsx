"use client";

import type { TourListing } from "@/types";
import TourEmbedCompactCard from "./TourEmbedCompactCard";
import TourEmbedSpotlightCard from "./TourEmbedSpotlightCard";
import { getTourListingReactKey } from "@/lib/tour-public-display";

interface TourEmbedFeaturedLayoutProps {
  tours: TourListing[];
  matchReasons?: Record<string, string>;
}

export default function TourEmbedFeaturedLayout({ tours, matchReasons }: TourEmbedFeaturedLayoutProps) {
  if (tours.length === 0) return null;

  const [primary, ...rest] = tours;

  if (tours.length === 1) {
    return <TourEmbedSpotlightCard tour={primary} matchReason={matchReasons?.[primary.slug]} />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TourEmbedSpotlightCard
        tour={primary}
        className="lg:min-h-full"
        matchReason={matchReasons?.[primary.slug]}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {rest.slice(0, 2).map((tour) => (
          <TourEmbedCompactCard
            key={getTourListingReactKey(tour)}
            tour={tour}
            layout="horizontal"
            matchReason={matchReasons?.[tour.slug]}
          />
        ))}
      </div>
    </div>
  );
}
