import { getHubFlightPriceTeasers } from "@/lib/flights/hub-price-teasers";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import FlightPriceTeaserCard from "@/components/flights/FlightPriceTeaserCard";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";

type FlightPriceTeaserGridProps = {
  locale?: LocaleCode;
  title?: string;
  className?: string;
};

export default async function FlightPriceTeaserGrid({
  locale = "ru",
  title,
  className,
}: FlightPriceTeaserGridProps) {
  const labels = getFlightTeaserLabels(locale);
  const teasers = await getHubFlightPriceTeasers(locale);
  if (teasers.length === 0) return null;

  return (
    <div className={cn(className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">
        {title ?? labels.hubTitle}
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {teasers.map((teaser) => (
          <li key={teaser.routeId}>
            <FlightPriceTeaserCard teaser={teaser} locale={locale} labels={labels} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-slate">{labels.disclaimer}</p>
    </div>
  );
}
