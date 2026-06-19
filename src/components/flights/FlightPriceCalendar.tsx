import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { buttonVariants } from "@/components/ui/button";
import { getFlightRouteLabels } from "@/lib/flights/route-labels";
import { formatTeaserPrice } from "@/lib/flights/teaser-format";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import type { MonthlyFlightPrice } from "@/lib/travelpayouts/aviasales/data-api";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";

type FlightPriceCalendarProps = {
  origin: string;
  destination: string;
  originLabel: string;
  destinationLabel: string;
  routeId: string;
  months: MonthlyFlightPrice[];
  locale?: LocaleCode;
  className?: string;
};

function formatMonthLabel(monthKey: string, locale: LocaleCode): string {
  try {
    const date = parseISO(`${monthKey}-01`);
    return format(date, "LLLL yyyy", { locale: locale === "ru" ? ru : undefined });
  } catch {
    return monthKey;
  }
}

export default function FlightPriceCalendar({
  origin,
  destination,
  originLabel,
  destinationLabel,
  routeId,
  months,
  locale = "ru",
  className,
}: FlightPriceCalendarProps) {
  const labels = getFlightRouteLabels(locale);
  const searchHref = buildFlightsSearchHref(origin, destination);

  return (
    <section className={cn("rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8", className)}>
      <header className="flex items-start gap-3 border-b border-gray-100 pb-4">
        <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-sky" aria-hidden />
        <div>
          <h2 className="font-heading text-2xl font-bold text-charcoal">{labels.calendarTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">{labels.calendarSubtitle}</p>
        </div>
      </header>

      {months.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {months.map((entry) => (
            <li
              key={`${routeId}-${entry.month}`}
              className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                {formatMonthLabel(entry.month, locale)}
              </p>
              <p className="mt-2 font-heading text-xl font-bold text-charcoal">
                {labels.calendarCheapest.replace(
                  "{price}",
                  formatTeaserPrice(
                    {
                      routeId,
                      origin,
                      destination,
                      originLabel,
                      destinationLabel,
                      price: entry.cheapestPrice,
                      currency: entry.currency,
                      departureAt: entry.cheapestDate,
                    },
                    locale
                  )
                )}
              </p>
              <p className="mt-1 text-xs text-slate">
                {labels.calendarMonth.replace(
                  "{date}",
                  formatTeaserDateSafe(entry.cheapestDate, locale)
                )}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-slate">{labels.calendarEmpty}</p>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-slate">{labels.calendarDisclaimer}</p>

      <Link
        href={searchHref}
        className={cn(buttonVariants({ variant: "outline" }), "mt-4 rounded-full border-sky/30 text-sky hover:bg-sky/5")}
      >
        {labels.searchCta}
      </Link>
    </section>
  );
}

function formatTeaserDateSafe(iso: string, locale: LocaleCode): string {
  try {
    return format(parseISO(iso), "d MMMM", { locale: locale === "ru" ? ru : undefined });
  } catch {
    return iso;
  }
}
