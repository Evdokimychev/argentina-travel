"use client";

import FlightPopularRoutes from "@/components/flights/FlightPopularRoutes";
import FlightsWhitelabelWidget from "@/components/flights/FlightsWhitelabelWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { pageBandSectionClass } from "@/lib/page-band";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import "./flights-page.css";

export default function FlightsWhitelabelView({ scriptUrl }: { scriptUrl: string }) {
  const { t } = useLocaleCurrency();

  return (
    <div className="flights-page-root w-full">
      <header className={pageBandSectionClass}>
        <div className={cn(siteContainerClass, "py-8 sm:py-10 lg:py-11")}>
          <h1 className="max-w-2xl font-display text-[1.75rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl lg:text-[2.35rem]">
            {t("flights.page.title")}
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-slate sm:text-[1.05rem]">
            {t("flights.page.tagline")}
          </p>
        </div>
      </header>

      <div className={cn(siteContainerClass, "relative z-10 pb-14 pt-5 sm:pb-16 sm:pt-6 lg:pb-20")}>
        <div id="flights-search" className="scroll-mt-[calc(var(--site-header-height,72px)+1rem)]">
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
