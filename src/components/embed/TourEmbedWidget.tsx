"use client";

import { useMemo } from "react";
import type { TourListing } from "@/types";
import type { TourEmbedConfig } from "@/types/tour-embed";
import { resolveTourEmbedWidget } from "@/lib/tour-embed";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import TourEmbedGrid from "./TourEmbedGrid";
import TourEmbedFeaturedLayout from "./TourEmbedFeaturedLayout";
import TourEmbedCompactList from "./TourEmbedCompactList";
import TourEmbedStrip from "./TourEmbedStrip";
import TourEmbedSpotlightCard from "./TourEmbedSpotlightCard";

interface TourEmbedWidgetProps {
  config: TourEmbedConfig;
  initialTours: TourListing[];
}

export default function TourEmbedWidget({ config, initialTours }: TourEmbedWidgetProps) {
  const tours = useRepositoryTourListings(initialTours);
  const resolved = useMemo(
    () => resolveTourEmbedWidget(tours, config),
    [tours, config]
  );

  if (!resolved.length) return null;

  switch (config.variant) {
    case "spotlight":
      return <TourEmbedSpotlightCard tour={resolved[0]} />;
    case "featured":
      return <TourEmbedFeaturedLayout tours={resolved} />;
    case "compact-list":
      return <TourEmbedCompactList tours={resolved} />;
    case "strip":
      return <TourEmbedStrip tours={resolved} />;
    case "grid":
    default:
      return <TourEmbedGrid tours={resolved} columns={resolved.length <= 2 ? 2 : 3} />;
  }
}
