import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { FlightPopularRoute } from "@/data/flight-popular-routes";
import { getFlightPopularRouteGroups } from "@/data/flight-popular-routes";
import { cn } from "@/lib/utils";

export function getFlightPopularRoutePillClassName(compact = false): string {
  return cn(
    "group inline-flex shrink-0 flex-col items-start gap-0.5 rounded-xl border border-gray-100 bg-white text-left text-charcoal transition-all hover:border-sky/25 hover:bg-sky/[0.04]",
    compact ? "px-2.5 py-1.5 shadow-sm" : "px-4 py-2.5 shadow-card hover:shadow-elevated",
  );
}

export function getFlightPopularRouteAriaLabel(route: FlightPopularRoute): string {
  return `${route.originLabel} — ${route.destinationLabel}`;
}

type FlightPopularRoutePillContentProps = {
  route: FlightPopularRoute;
};

export function FlightPopularRoutePillContent({ route }: FlightPopularRoutePillContentProps) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded-md bg-slate/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none tracking-wide text-slate">
          {route.origin}
        </span>
        <ArrowRight className="h-3 w-3 shrink-0 text-slate/60" aria-hidden />
        <span className="rounded-md bg-sky/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none tracking-wide text-sky">
          {route.destination}
        </span>
      </span>
      <span className="text-[11px] leading-tight">
        <span className="text-slate">{route.originLabel}</span>
        <span className="text-slate/40"> · </span>
        <span className="font-medium text-charcoal">{route.destinationLabel}</span>
      </span>
    </>
  );
}

function FlightPopularRouteSeparator({ prominent = false }: { prominent?: boolean }) {
  return (
    <div
      className={cn(
        "mx-1 w-px shrink-0 self-stretch bg-gray-200",
        prominent && "mx-2 bg-gray-300",
      )}
      aria-hidden
    />
  );
}

type FlightPopularRoutesGroupedProps = {
  compact?: boolean;
  routesClassName?: string;
  className?: string;
  renderRoute: (props: {
    route: FlightPopularRoute;
    className: string;
    ariaLabel: string;
  }) => ReactNode;
};

export function FlightPopularRoutesGrouped({
  compact = false,
  routesClassName,
  className,
  renderRoute,
}: FlightPopularRoutesGroupedProps) {
  const { international, domestic } = getFlightPopularRouteGroups();
  const routes = [...international, ...domestic];
  const pillClassName = getFlightPopularRoutePillClassName(compact);
  const firstDomesticId = domestic[0]?.id;

  return (
    <div
      className={cn(
        "scrollbar-hide flex flex-nowrap items-stretch overflow-x-auto pb-1",
        className,
        routesClassName,
      )}
    >
      {routes.map((route, index) => {
        const showSeparator = index > 0;
        const prominentSeparator = showSeparator && route.id === firstDomesticId;

        return (
          <div key={route.id} className="flex shrink-0 items-stretch">
            {showSeparator ? <FlightPopularRouteSeparator prominent={prominentSeparator} /> : null}
            {renderRoute({
              route,
              className: pillClassName,
              ariaLabel: getFlightPopularRouteAriaLabel(route),
            })}
          </div>
        );
      })}
    </div>
  );
}
