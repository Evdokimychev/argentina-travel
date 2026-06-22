import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FLIGHT_POPULAR_ROUTES, buildFlightRouteHref } from "@/data/flight-popular-routes";
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
      <div className={cn("flex flex-wrap gap-2", compact ? "mt-3 gap-2" : "mt-4 gap-2.5")}>
        {FLIGHT_POPULAR_ROUTES.map((route) => (
          <Link
            key={route.id}
            href={buildFlightRouteHref(route.id)}
            className={cn(
              "group inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white text-charcoal transition-all hover:border-sky/25 hover:bg-sky/[0.04]",
              compact
                ? "px-3 py-2 text-xs shadow-sm"
                : "px-4 py-2.5 text-sm shadow-card hover:shadow-elevated",
            )}
          >
            <span>
              {route.originLabel} → {route.destinationLabel}
            </span>
            <ArrowRight className="h-4 w-4 text-slate group-hover:text-sky" />
          </Link>
        ))}
      </div>
    </section>
  );
}
