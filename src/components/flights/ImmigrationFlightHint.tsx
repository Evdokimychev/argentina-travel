import Link from "next/link";
import { ArrowUpRight, Plane } from "lucide-react";
import FlightPriceTeaserCard from "@/components/flights/FlightPriceTeaserCard";
import { getFlightPriceTeasers } from "@/lib/flights/hub-price-teasers";
import { getFlightRouteLabels } from "@/lib/flights/route-labels";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { buildFlightRouteHref } from "@/data/flight-popular-routes";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";

const IMMIGRATION_FLIGHT_ROUTE_IDS = ["mow-bue"] as const;

type ImmigrationFlightHintProps = {
  locale?: LocaleCode;
  className?: string;
};

export default async function ImmigrationFlightHint({
  locale = "ru",
  className,
}: ImmigrationFlightHintProps) {
  const routeLabels = getFlightRouteLabels(locale);
  const teaserLabels = getFlightTeaserLabels(locale);
  const teasers = await getFlightPriceTeasers(IMMIGRATION_FLIGHT_ROUTE_IDS, locale);
  const teaser = teasers[0];

  return (
    <section
      className={cn(
        "rounded-3xl border border-sky/20 bg-gradient-to-br from-sky/10 via-white to-sky/5 p-6 shadow-card sm:p-8",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Plane className="mt-0.5 h-6 w-6 shrink-0 text-sky" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-bold text-charcoal">{routeLabels.immigrationTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">{routeLabels.immigrationSubtitle}</p>
        </div>
      </div>

      {teaser ? (
        <div className="mt-5 max-w-sm">
          <FlightPriceTeaserCard teaser={teaser} locale={locale} labels={teaserLabels} compact />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={buildFlightRouteHref("mow-bue")}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
        >
          Москва → Буэнос-Айрес
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <Link
          href="/flights"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate hover:text-sky"
        >
          {teaserLabels.fullSearch}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate">{teaserLabels.disclaimer}</p>
    </section>
  );
}
