import Link from "next/link";
import { ArrowRight, ArrowUpRight, ExternalLink, Plane } from "lucide-react";
import HubHero from "@/components/guide/hub/HubHero";
import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import FlightPriceTeaserCard from "@/components/flights/FlightPriceTeaserCard";
import FlightRoutePriceWidget from "@/components/flights/FlightRoutePriceWidget";
import { buttonVariants } from "@/components/ui/button";
import {
  buildFlightRouteHref,
  type FlightPopularRoute,
} from "@/data/flight-popular-routes";
import type { FlightPriceTeaser } from "@/lib/flights/hub-price-teasers";
import { getFlightRouteLabels } from "@/lib/flights/route-labels";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { cn } from "@/lib/utils";
import { siteContainerClass } from "@/lib/site-container";
import type { LocaleCode } from "@/types/locale";

type FlightRouteLandingViewProps = {
  route: FlightPopularRoute;
  teaser: FlightPriceTeaser | null;
  priceWidgetScriptUrl: string;
  relatedRoutes: FlightPopularRoute[];
  locale?: LocaleCode;
};

export default function FlightRouteLandingView({
  route,
  teaser,
  priceWidgetScriptUrl,
  relatedRoutes,
  locale = "ru",
}: FlightRouteLandingViewProps) {
  const labels = getFlightRouteLabels(locale);
  const teaserLabels = getFlightTeaserLabels(locale);
  const path = buildFlightRouteHref(route.id);
  const searchHref = buildFlightsSearchHref(route.origin, route.destination);

  const heroTitle = labels.heroTitle
    .replace("{origin}", route.originLabel)
    .replace("{destination}", route.destinationLabel);
  const heroSubtitle = labels.heroSubtitle
    .replace("{origin}", route.originLabel)
    .replace("{destination}", route.destinationLabel);
  const routeIntro = labels.getRouteIntro(route.id, route.originLabel, route.destinationLabel);
  const faqItems = labels.getFaqItems(route.originLabel, route.destinationLabel);

  return (
    <>
      <WebPageJsonLd name={heroTitle} description={heroSubtitle} path={path} />

      <HubHero
        title={heroTitle}
        subtitle={heroSubtitle}
        image={getServicePageHeroImage("flights")}
        eyebrow={{ label: labels.eyebrow, href: "/flights" }}
        ctas={[
          { label: labels.searchCta, href: searchHref, variant: "primary" },
        ]}
      />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="transition-colors hover:text-sky">
              {labels.breadcrumbHome}
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href="/flights" className="transition-colors hover:text-sky">
              {labels.breadcrumbFlights}
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">
              {route.originLabel} → {route.destinationLabel}
            </span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0 space-y-8">
              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                <p className="text-sm leading-relaxed text-slate">{routeIntro}</p>
              </section>

              <FlightRoutePriceWidget
                origin={route.origin}
                destination={route.destination}
                scriptUrl={priceWidgetScriptUrl}
                locale={locale}
              />

              {relatedRoutes.length > 0 ? (
                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                  <h2 className="font-heading text-2xl font-bold text-charcoal">{labels.relatedTitle}</h2>
                  <p className="mt-2 text-sm text-slate">{labels.relatedSubtitle}</p>
                  <ul className="mt-5 flex flex-wrap gap-2.5">
                    {relatedRoutes.map((related) => (
                      <li key={related.id}>
                        <Link
                          href={buildFlightRouteHref(related.id)}
                          className="group inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-surface-muted/40 px-4 py-2.5 text-sm text-charcoal transition-all hover:border-sky/25 hover:bg-sky/[0.04]"
                        >
                          <span>
                            {related.originLabel} → {related.destinationLabel}
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate group-hover:text-sky" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <GuidePillarFaq items={faqItems} intro={labels.faqIntro} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              {teaser ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                  <div className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                    <Plane className="h-5 w-5 text-sky" aria-hidden />
                    {teaserLabels.hubTitle}
                  </div>
                  <div className="mt-4">
                    <FlightPriceTeaserCard teaser={teaser} locale={locale} labels={teaserLabels} />
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate">{teaserLabels.disclaimer}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-card">
                  <p className="font-heading text-lg font-bold text-charcoal">{labels.noTeaserTitle}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{labels.noTeaserBody}</p>
                  <Link
                    href={searchHref}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "mt-4 w-full rounded-full"
                    )}
                  >
                    {labels.noTeaserCta}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/contacts"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate hover:text-sky"
                  >
                    {labels.contactCta}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <Link
                href={searchHref}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex w-full items-center justify-center rounded-full border-sky/30 text-sky hover:bg-sky/5"
                )}
              >
                {labels.searchCta}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
