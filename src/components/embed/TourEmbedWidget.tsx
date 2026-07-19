"use client";

import { useMemo } from "react";
import type { TourListing } from "@/types";
import type { TourEmbedConfig } from "@/types/tour-embed";
import { resolveTourEmbedWidgetMatches } from "@/lib/tour-embed";
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
  const matches = useMemo(
    () => resolveTourEmbedWidgetMatches(tours, config),
    [tours, config]
  );

  if (!matches.length) return null;

  const resolved = matches.map((match) => match.tour);
  const shouldShowReasons =
    config.showMatchReasons ?? !["preset", "organizer"].includes(config.source.kind);
  const matchReasons = shouldShowReasons
    ? Object.fromEntries(
        matches
          .filter((match) => match.reasons.length > 0)
          .map((match) => [match.tour.slug, match.reasons.join(". ")]),
      )
    : undefined;

  switch (config.variant) {
    case "spotlight":
      return <TourEmbedSpotlightCard tour={resolved[0]} matchReason={matchReasons?.[resolved[0].slug]} />;
    case "featured":
      return <TourEmbedFeaturedLayout tours={resolved} matchReasons={matchReasons} />;
    case "compact-list":
      return <TourEmbedCompactList tours={resolved} matchReasons={matchReasons} />;
    case "strip":
      return <TourEmbedStrip tours={resolved} matchReasons={matchReasons} />;
    case "grid":
    default:
      return (
        <TourEmbedGrid
          tours={resolved}
          columns={resolved.length <= 2 ? 2 : 3}
          matchReasons={matchReasons}
        />
      );
  }
}
