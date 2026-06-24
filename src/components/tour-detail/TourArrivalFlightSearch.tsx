"use client";

import { useContext, useMemo, useState } from "react";
import { parseISO, startOfDay } from "date-fns";
import { ArrowRight, MapPin, Plane } from "lucide-react";
import { TourBookingContext } from "@/components/tour-detail/TourBookingContext";
import TourFlightBriefingPanel from "@/components/tour-detail/TourFlightBriefingPanel";
import TourFlightComplexSearchForm from "@/components/tour-detail/TourFlightComplexSearchForm";
import TourFlightResultsModal, {
  type TourFlightResultsEntry,
} from "@/components/tour-detail/TourFlightResultsModal";
import { cn } from "@/lib/cn";
import {
  resolveTourFlightFormSegments,
  resolveTourFlightPrefill,
} from "@/lib/flights/tour-flight-prefill";
import { buildParsedFlightsSearchFromSubmit } from "@/lib/flights/wl-search-params";
import { useFlightOriginGeolocation } from "@/hooks/useFlightOriginGeolocation";

type TourArrivalFlightSearchProps = {
  startCity: string;
  finishCity?: string;
  startTime?: string;
  finishTime?: string;
  className?: string;
};

function readDate(value?: string | null): Date | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    return startOfDay(parseISO(trimmed));
  } catch {
    return undefined;
  }
}

export default function TourArrivalFlightSearch({
  startCity,
  finishCity,
  startTime,
  finishTime,
  className,
}: TourArrivalFlightSearchProps) {
  const booking = useContext(TourBookingContext);
  const { originCode } = useFlightOriginGeolocation();
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultSearches, setResultSearches] = useState<TourFlightResultsEntry[]>([]);
  const [resultsTitle, setResultsTitle] = useState("Результаты поиска");

  const selectedDeparture = booking?.scheduleDates.find(
    (date) => date.id === booking.selectedDateId,
  );
  const hasTourDates = Boolean(
    booking?.selectedDateId && selectedDeparture?.startDate?.trim(),
  );
  const tourStartDate = hasTourDates ? readDate(selectedDeparture?.startDate) : undefined;
  const tourEndDate = hasTourDates ? readDate(selectedDeparture?.endDate) : undefined;

  const prefill = useMemo(
    () =>
      resolveTourFlightPrefill({
        userOriginCode: originCode,
        startCity,
        finishCity,
        tourStartDate,
        tourEndDate,
        startTime,
        finishTime,
      }),
    [originCode, startCity, finishCity, tourStartDate, tourEndDate, startTime, finishTime],
  );

  const segments = useMemo(() => resolveTourFlightFormSegments(prefill), [prefill]);

  const openResults = (searches: TourFlightResultsEntry[]) => {
    setResultSearches(searches);
    setResultsTitle(
      prefill.isOpenJaw ? "Авиабилеты по маршруту тура" : "Авиабилеты до места встречи",
    );
    setResultsOpen(true);
  };

  return (
    <>
      <section
        className={cn(
          "rounded-2xl border border-white/90 bg-white/95 p-3 shadow-sm sm:p-4",
          className,
        )}
        aria-label="Поиск авиабилетов до места встречи"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky/10 text-sky">
              <Plane className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-charcoal">Авиабилеты до места встречи</h4>
              <p className="text-xs text-slate">Подберите перелёт сами</p>
            </div>
          </div>
          <p className="inline-flex max-w-full items-center gap-1 rounded-full bg-sky/8 px-2.5 py-1 text-[11px] font-medium text-sky">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {prefill.isOpenJaw ? (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <span className="truncate">{prefill.startDestination.label}</span>
                <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{prefill.finishDestination.label}</span>
              </span>
            ) : (
              <span className="truncate">{prefill.startDestination.label}</span>
            )}
          </p>
        </div>

        <div className="mt-3">
          <TourFlightBriefingPanel briefing={prefill.briefing} compact />
        </div>

        <div className="mt-3">
          <TourFlightComplexSearchForm
            segments={segments}
            initialAdults={booking?.guests}
            emptyDates={!hasTourDates}
            onSearch={(submissions) => {
              openResults(
                submissions.map((item) => ({
                  id: item.id,
                  tabLabel: item.tabLabel,
                  subtitle: item.subtitle,
                  parsedSearch: buildParsedFlightsSearchFromSubmit(item.params),
                })),
              );
            }}
            className="rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5"
          />
        </div>
      </section>

      <TourFlightResultsModal
        open={resultsOpen}
        onOpenChange={setResultsOpen}
        searches={resultSearches}
        briefing={prefill.briefing}
        title={resultsTitle}
      />
    </>
  );
}
