"use client";

import Link from "next/link";
import {
  FlightPopularRoutePillContent,
  FlightPopularRoutesGrouped,
} from "@/components/flights/FlightPopularRoutePill";
import { buildFlightPopularRouteSearchHref } from "@/lib/flights/search-href";
import { cn } from "@/lib/utils";

type FlightsHeroPopularRoutesProps = {
  className?: string;
};

export default function FlightsHeroPopularRoutes({ className }: FlightsHeroPopularRoutesProps) {
  return (
    <FlightPopularRoutesGrouped
      compact
      className={cn(className)}
      renderRoute={({ route, className: pillClassName, ariaLabel }) => (
        <Link
          key={route.id}
          href={buildFlightPopularRouteSearchHref(route)}
          className={pillClassName}
          aria-label={ariaLabel}
        >
          <FlightPopularRoutePillContent route={route} />
        </Link>
      )}
    />
  );
}
