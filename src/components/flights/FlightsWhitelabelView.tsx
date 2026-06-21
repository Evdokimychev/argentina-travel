"use client";

import { Plane } from "lucide-react";
import Hero from "@/components/Hero";
import FlightPopularRoutes from "@/components/flights/FlightPopularRoutes";
import FlightsWhitelabelWidget from "@/components/flights/FlightsWhitelabelWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";

const HERO_IMAGE = getServicePageHeroImage("flights");

export default function FlightsWhitelabelView({ scriptUrl }: { scriptUrl: string }) {
  const { t } = useLocaleCurrency();

  return (
    <div className="flights-page-root w-full">
      <Hero
        eyebrow={t("flights.eyebrow")}
        title={t("flights.title")}
        subtitle={t("flights.subtitle")}
        description={t("flights.intro")}
        image={HERO_IMAGE}
        compact
        ctaText={t("flights.whitelabel.heroCta")}
        ctaHref="#flights-search"
      />

      <section className={cn(siteContainerClass, "py-10 sm:py-14")}>
        <div id="flights-search" className="scroll-mt-24">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-sky" aria-hidden />
            <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
              {t("flights.whitelabel.searchTitle")}
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
            {t("flights.whitelabel.partnerNote")}
          </p>
          <div className="mt-6">
            <FlightsWhitelabelWidget
              scriptUrl={scriptUrl}
              loadingLabel={t("flights.whitelabel.widgetLoading")}
            />
          </div>
        </div>

        <FlightPopularRoutes title={t("flights.popular.title")} className="mt-12 border-t border-gray-100 pt-10" />

        <p className="mt-8 text-xs leading-relaxed text-slate">{t("flights.disclaimer")}</p>
      </section>
    </div>
  );
}
