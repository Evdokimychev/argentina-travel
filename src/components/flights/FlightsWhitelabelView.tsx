"use client";

import FlightPopularRoutes from "@/components/flights/FlightPopularRoutes";
import FlightsHeroPopularRoutes from "@/components/flights/FlightsHeroPopularRoutes";
import FlightsWhitelabelWidget from "@/components/flights/FlightsWhitelabelWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import "./flights-page.css";

export default function FlightsWhitelabelView({ scriptUrl }: { scriptUrl: string }) {
  const { t } = useLocaleCurrency();

  return (
    <div className="flights-page-root w-full">
      <header className="flights-page-hero" data-scroll-rail-tone="light">
        <div className="flights-page-hero__glow flights-page-hero__glow--primary" aria-hidden />
        <div className="flights-page-hero__glow flights-page-hero__glow--secondary" aria-hidden />
        <div className={cn(siteContainerClass, "relative pt-10 pb-9 md:pt-12 sm:pb-10 lg:pt-14 lg:pb-12")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:gap-6">
            <h1 className="max-w-2xl font-display text-[1.75rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl lg:text-[2.35rem]">
              {t("flights.page.title")}
            </h1>
            <FlightsHeroPopularRoutes className="sm:max-w-[55%] sm:shrink-0 lg:max-w-[48%] xl:max-w-[44%]" />
          </div>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-slate/90 sm:text-[1.05rem]">
            {t("flights.page.tagline")}
          </p>
        </div>
      </header>

      <div className={cn(siteContainerClass, "relative pb-14 sm:pb-16 lg:pb-20")}>
        <div
          id="flights-search"
          className="flights-page-search-shell scroll-mt-[calc(var(--site-header-height,72px)+1rem)]"
        >
          <FlightsWhitelabelWidget
            scriptUrl={scriptUrl}
            loadingLabel={t("flights.whitelabel.widgetLoading")}
          />
        </div>

        <footer className="mt-10 border-t border-gray-100 pt-8 sm:mt-12 sm:pt-10">
          <FlightPopularRoutes title={t("flights.popular.title")} compact />
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate/75">
            {t("flights.page.disclaimer")}
          </p>
        </footer>
      </div>
    </div>
  );
}
