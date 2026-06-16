import Link from "next/link";
import { ArrowUpRight, Plane } from "lucide-react";
import type { FlightPriceTeaser } from "@/lib/flights/hub-price-teasers";
import type { FlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import {
  buildTeaserBookHref,
  formatTeaserDate,
  formatTeaserPrice,
} from "@/lib/flights/teaser-format";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";

type FlightPriceTeaserCardProps = {
  teaser: FlightPriceTeaser;
  locale?: LocaleCode;
  labels?: FlightTeaserLabels;
  compact?: boolean;
  className?: string;
};

export default function FlightPriceTeaserCard({
  teaser,
  locale = "ru",
  labels: labelsProp,
  compact = false,
  className,
}: FlightPriceTeaserCardProps) {
  const labels = labelsProp ?? getFlightTeaserLabels(locale);
  const priceLabel = formatTeaserPrice(teaser, locale);
  const dateLabel = formatTeaserDate(teaser.departureAt);
  const href = buildTeaserBookHref(teaser, locale);

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:border-sky/25 hover:shadow-elevated",
        compact ? "p-3.5" : "h-full p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-slate">
        <Plane className="h-4 w-4 shrink-0 text-sky" aria-hidden />
        <span className={cn("font-medium text-charcoal", compact && "text-xs")}>
          {teaser.originLabel} → {teaser.destinationLabel}
        </span>
      </div>
      <p className={cn("mt-2 font-heading font-bold text-charcoal", compact ? "text-xl" : "text-2xl")}>
        {priceLabel}
      </p>
      <p className="mt-1 text-xs text-slate">
        {dateLabel ? `${labels.fromDate} ${dateLabel}` : labels.aviasalesNote}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky">
        {labels.viewTickets}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
