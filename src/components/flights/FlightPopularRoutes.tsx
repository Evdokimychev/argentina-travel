import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FLIGHT_POPULAR_ROUTES, buildFlightRouteHref } from "@/data/flight-popular-routes";
import { cn } from "@/lib/utils";

type FlightPopularRoutesProps = {
  title: string;
  className?: string;
};

export default function FlightPopularRoutes({ title, className }: FlightPopularRoutesProps) {
  return (
    <section className={cn(className)}>
      <h2 className="font-heading text-lg font-bold text-charcoal">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {FLIGHT_POPULAR_ROUTES.map((route) => (
          <Link
            key={route.id}
            href={buildFlightRouteHref(route.id)}
            className="group inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm text-charcoal shadow-card transition-all hover:border-sky/25 hover:bg-sky/[0.04] hover:shadow-elevated"
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
