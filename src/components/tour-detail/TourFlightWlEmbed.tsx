"use client";

import { useMemo } from "react";
import {
  buildFlightsWlEmbedHref,
  type ParsedFlightsSearch,
} from "@/lib/flights/wl-search-params";

function buildIframeKey(parsedSearch: ParsedFlightsSearch): string {
  if (parsedSearch.segments?.length) {
    return parsedSearch.segments
      .map((segment) => `${segment.origin}-${segment.destination}-${segment.departDate}`)
      .join("|");
  }

  return `${parsedSearch.origin}-${parsedSearch.destination}-${parsedSearch.departDate ?? ""}-${parsedSearch.returnDate ?? ""}-${parsedSearch.tripType}`;
}

/**
 * Loads WL search + results in an isolated /embed document (no site header).
 * Parent tour page URL is never modified — avoids Next.js RSC reload.
 */
export default function TourFlightWlEmbed({
  parsedSearch,
  title = "Результаты поиска авиабилетов",
}: {
  parsedSearch: ParsedFlightsSearch;
  title?: string;
}) {
  const src = useMemo(() => buildFlightsWlEmbedHref(parsedSearch), [parsedSearch]);

  return (
    <iframe
      key={buildIframeKey(parsedSearch)}
      src={src}
      title={title}
      className="block h-[min(78dvh,920px)] w-full rounded-2xl border-0 bg-transparent shadow-none"
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
