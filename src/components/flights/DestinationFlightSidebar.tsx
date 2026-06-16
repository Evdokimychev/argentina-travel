import Link from "next/link";
import { ArrowUpRight, Plane } from "lucide-react";
import { getDestinationFlightTeasers } from "@/lib/flights/hub-price-teasers";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import FlightPriceTeaserCard from "@/components/flights/FlightPriceTeaserCard";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";

type DestinationFlightSidebarProps = {
  destinationId: string;
  destinationName: string;
  locale?: LocaleCode;
  className?: string;
};

export default async function DestinationFlightSidebar({
  destinationId,
  destinationName,
  locale = "ru",
  className,
}: DestinationFlightSidebarProps) {
  const labels = getFlightTeaserLabels(locale);
  const teasers = await getDestinationFlightTeasers(destinationId, locale);
  const primary = teasers[0];

  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-5 shadow-card", className)}>
      <div className="flex items-start gap-3">
        <Plane className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-charcoal">{labels.destinationTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            {labels.destinationIntro.replace("{destination}", destinationName)}
          </p>
        </div>
      </div>

      {teasers.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {teasers.map((teaser) => (
            <li key={teaser.routeId}>
              <FlightPriceTeaserCard teaser={teaser} locale={locale} labels={labels} compact />
            </li>
          ))}
        </ul>
      ) : (
        <Link
          href="/flights?origin=MOW&destination=BUE"
          className="mt-4 flex items-center justify-between rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm font-medium text-sky transition-colors hover:bg-sky/10"
        >
          {labels.compareFlights}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}

      {primary ? (
        <Link
          href={buildFlightsSearchHref(primary.origin, primary.destination)}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate hover:text-sky"
        >
          {labels.fullSearch}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
