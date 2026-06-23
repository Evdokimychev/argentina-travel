"use client";

import Link from "next/link";
import {
  FlightPopularRoutePillContent,
  FlightPopularRoutesGrouped,
} from "@/components/flights/FlightPopularRoutePill";
import { buildFlightRouteHref } from "@/data/flight-popular-routes";
import { cn } from "@/lib/utils";

type FlightPopularRoutesProps = {
  title: string;
  className?: string;
  compact?: boolean;
};

export default function FlightPopularRoutes({
  title,
  className,
  compact = false,
}: FlightPopularRoutesProps) {
  return (
    <section className={cn(className)}>
      <h2
        className={cn(
          "font-heading font-semibold text-charcoal",
          compact ? "text-sm uppercase tracking-wide text-slate" : "text-lg font-bold",
        )}
      >
        {title}
      </h2>
      <FlightPopularRoutesGrouped
        compact={compact}
        className={compact ? "mt-3" : "mt-4"}
        renderRoute={({ route, className: pillClassName, ariaLabel }) => (
          <Link
            key={route.id}
            href={buildFlightRouteHref(route.id)}
            className={pillClassName}
            aria-label={ariaLabel}
          >
            <FlightPopularRoutePillContent route={route} />
          </Link>
        )}
      />
    </section>
  );
}
