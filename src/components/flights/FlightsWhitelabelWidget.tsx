"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parseFlightsSearchParams, type ParsedFlightsSearch } from "@/lib/flights/wl-search-params";
import { FLIGHTS_WL_PAGE_MOUNT_ID } from "@/lib/travelpayouts/whitelabel/flights-dom-ids";
import FlightsWhitelabelWidgetCore from "@/components/flights/FlightsWhitelabelWidgetCore";

type FlightsWhitelabelWidgetProps = {
  scriptUrl: string;
  loadingLabel: string;
  className?: string;
  resultsOnly?: boolean;
  mountId?: string;
};

function FlightsWhitelabelWidgetFromUrl({
  scriptUrl,
  loadingLabel,
  className,
  resultsOnly,
  mountId,
}: FlightsWhitelabelWidgetProps) {
  const searchParams = useSearchParams();
  const parsedSearch = useMemo(
    () => parseFlightsSearchParams(searchParams),
    [searchParams],
  );

  return (
    <FlightsWhitelabelWidgetCore
      scriptUrl={scriptUrl}
      loadingLabel={loadingLabel}
      parsedSearch={parsedSearch}
      className={className}
      mountId={mountId ?? FLIGHTS_WL_PAGE_MOUNT_ID}
      resultsOnly={resultsOnly}
      urlSync="page"
    />
  );
}

export default function FlightsWhitelabelWidget(props: FlightsWhitelabelWidgetProps) {
  return <FlightsWhitelabelWidgetFromUrl {...props} />;
}
