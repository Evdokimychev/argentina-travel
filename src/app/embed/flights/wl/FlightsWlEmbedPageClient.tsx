"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FlightsWhitelabelWidget from "@/components/flights/FlightsWhitelabelWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  hasMinimumFlightsSearchParams,
  parseFlightsSearchParams,
} from "@/lib/flights/wl-search-params";
import { getTravelpayoutsWhitelabelScriptUrl } from "@/lib/travelpayouts/whitelabel/config";
import "@/components/flights/flights-page.css";

function FlightsWlEmbedInner() {
  const { t } = useLocaleCurrency();
  const searchParams = useSearchParams();
  const parsedSearch = parseFlightsSearchParams(searchParams);
  const resultsOnly = parsedSearch ? hasMinimumFlightsSearchParams(parsedSearch) : false;
  const scriptUrl = getTravelpayoutsWhitelabelScriptUrl();

  if (!scriptUrl) {
    return (
      <p className="p-4 text-sm text-slate">Поиск билетов временно недоступен.</p>
    );
  }

  return (
    <div className="flights-embed-root min-h-[100dvh] bg-surface-muted px-3 py-4 sm:px-4">
      <div className="flights-page-search-shell">
        <FlightsWhitelabelWidget
          scriptUrl={scriptUrl}
          loadingLabel={t("flights.whitelabel.widgetLoading")}
          resultsOnly={resultsOnly}
        />
      </div>
    </div>
  );
}

export default function FlightsWlEmbedPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-slate">
          Загрузка поиска…
        </div>
      }
    >
      <FlightsWlEmbedInner />
    </Suspense>
  );
}
