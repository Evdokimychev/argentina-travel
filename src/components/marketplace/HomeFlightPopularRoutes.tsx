"use client";

import {
  FlightPopularRoutePillContent,
  FlightPopularRoutesGrouped,
} from "@/components/flights/FlightPopularRoutePill";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";

type HomeFlightPopularRoutesProps = {
  onSelect: (route: { origin: string; destination: string }) => void;
  className?: string;
};

export default function HomeFlightPopularRoutes({
  onSelect,
  className,
}: HomeFlightPopularRoutesProps) {
  const { t } = useLocaleCurrency();

  return (
    <div className={cn(className)}>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate">
        {t("flights.popular.title")}
      </p>
      <FlightPopularRoutesGrouped
        compact
        className="mt-2"
        renderRoute={({ route, className: pillClassName, ariaLabel }) => (
          <button
            key={route.id}
            type="button"
            onClick={() => onSelect({ origin: route.origin, destination: route.destination })}
            className={pillClassName}
            aria-label={ariaLabel}
          >
            <FlightPopularRoutePillContent route={route} />
          </button>
        )}
      />
    </div>
  );
}
