import Link from "next/link";
import { ArrowUpRight, Car, Plane, Smartphone } from "lucide-react";
import { getHomeTravelPrepFlightTeaser } from "@/lib/flights/hub-price-teasers";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { formatTeaserPrice } from "@/lib/flights/teaser-format";
import { siteContainerClass } from "@/lib/site-container";
import type { LocaleCode } from "@/types/locale";

type TravelPrepStripProps = {
  locale?: LocaleCode;
};

export default async function TravelPrepStrip({ locale = "ru" }: TravelPrepStripProps) {
  const labels = getFlightTeaserLabels(locale);
  const flightTeasers = await getHomeTravelPrepFlightTeaser(locale);
  const mowBue = flightTeasers[0];

  const prepLinks = [
    {
      id: "flights",
      href: "/flights?origin=MOW&destination=BUE",
      icon: Plane,
      title: labels.travelPrepFlights,
      description: labels.travelPrepFlightsDesc,
    },
    {
      id: "transfers",
      href: "/transfers?from=eze&to=ba-center",
      icon: Car,
      title: labels.travelPrepTransfers,
      description: labels.travelPrepTransfersDesc,
    },
    {
      id: "esim",
      href: "/esim",
      icon: Smartphone,
      title: labels.travelPrepEsim,
      description: labels.travelPrepEsimDesc,
    },
  ] as const;

  return (
    <section className="border-b border-gray-100 bg-white py-8">
      <div className={siteContainerClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-ink">
              {labels.travelPrepEyebrow}
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold text-charcoal sm:text-2xl">
              {labels.travelPrepTitle}
            </h2>
          </div>
          <Link href="/services" className="text-sm font-medium text-sky-ink hover:underline">
            {labels.allServices} →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {prepLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/30 p-5 transition-all hover:border-sky/25 hover:bg-sky/[0.03] hover:shadow-card"
              >
                <Icon className="h-5 w-5 text-sky" aria-hidden />
                <p className="mt-3 font-heading font-bold text-charcoal group-hover:text-sky">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-slate">{item.description}</p>
                {item.id === "flights" && mowBue ? (
                  <p className="mt-3 text-sm font-semibold text-charcoal">
                    {labels.travelPrepFrom} {formatTeaserPrice(mowBue, locale)}
                  </p>
                ) : null}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-ink">
                  {labels.travelPrepOpen}
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
