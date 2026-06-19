import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import TourSection from "@/components/tour-detail/TourSection";
import FlightPriceTeaserCard from "@/components/flights/FlightPriceTeaserCard";
import { resolveTourFlightRouteIds } from "@/lib/flights/destination-airports";
import { getFlightPriceTeasers } from "@/lib/flights/hub-price-teasers";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import type { LocaleCode } from "@/types/locale";

type TourFlightLogisticsSectionProps = {
  destination: string;
  region: string;
  locale?: LocaleCode;
};

export default async function TourFlightLogisticsSection({
  destination,
  region,
  locale = "ru",
}: TourFlightLogisticsSectionProps) {
  const routeIds = resolveTourFlightRouteIds(destination, region);
  const teasers = await getFlightPriceTeasers(routeIds, locale);
  const labels = getFlightTeaserLabels(locale);

  if (teasers.length === 0) return null;

  const primary = teasers[0];

  return (
    <TourSection
      id="flight-logistics"
      title={labels.tourTitle}
      subtitle={labels.tourSubtitle.replace("{destination}", destination)}
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teasers.map((teaser) => (
          <li key={teaser.routeId}>
            <FlightPriceTeaserCard teaser={teaser} locale={locale} labels={labels} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-slate">{labels.disclaimer}</p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {primary ? (
          <Link
            href={buildFlightsSearchHref(primary.origin, primary.destination)}
            className="inline-flex items-center gap-1 font-medium text-sky hover:underline"
          >
            {labels.fullSearch}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
        <Link
          href="/guide/kak-dobratsya#aviasales"
          className="inline-flex items-center gap-1 font-medium text-slate hover:text-sky"
        >
          {labels.guideLink}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </TourSection>
  );
}
