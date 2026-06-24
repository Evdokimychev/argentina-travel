"use client";

import FlightsWhitelabelWidgetCore from "@/components/flights/FlightsWhitelabelWidgetCore";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { ParsedFlightsSearch, WlUrlSyncMode } from "@/lib/flights/wl-search-params";
import { getTravelpayoutsWhitelabelScriptUrl } from "@/lib/travelpayouts/whitelabel/config";
import { TOUR_FLIGHT_WL_MOUNT_ID } from "@/lib/travelpayouts/whitelabel/flights-dom-ids";

export type TravelpayoutsFlightsWidgetsProps = {
  parsedSearch: ParsedFlightsSearch | null;
  resultsOnly?: boolean;
  className?: string;
  mountId?: string;
  urlSync?: WlUrlSyncMode;
  scriptUrl?: string;
};

/**
 * Inline Travelpayouts WL search form + results (`#tpwl-search`, `#tpwl-tickets`).
 * Reusable in modals and any page that passes explicit search params (not URL-only).
 */
export default function TravelpayoutsFlightsWidgets({
  parsedSearch,
  resultsOnly = false,
  className,
  mountId = TOUR_FLIGHT_WL_MOUNT_ID,
  urlSync = "inline",
  scriptUrl,
}: TravelpayoutsFlightsWidgetsProps) {
  const { t } = useLocaleCurrency();

  return (
    <FlightsWhitelabelWidgetCore
      scriptUrl={scriptUrl ?? getTravelpayoutsWhitelabelScriptUrl()}
      loadingLabel={t("flights.whitelabel.widgetLoading")}
      parsedSearch={parsedSearch}
      className={className}
      mountId={mountId}
      resultsOnly={resultsOnly}
      urlSync={urlSync}
    />
  );
}
