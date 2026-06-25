"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { X } from "lucide-react";
import TourFlightModalTourContext from "@/components/tour-detail/TourFlightModalTourContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TourFlightBriefing } from "@/lib/flights/tour-flight-prefill";
import {
  buildWlWidgetRemountKey,
  hasMinimumFlightsSearchParams,
  mergeTourFlightSearchesIntoComplex,
  restoreInlineWlSearchParams,
  type ParsedFlightsSearch,
} from "@/lib/flights/wl-search-params";
import { cn } from "@/lib/cn";
import "./tour-flight-modal.css";

const TravelpayoutsFlightsWidgets = dynamic(
  () => import("@/components/flights/TravelpayoutsFlightsWidgets"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 px-4 py-5">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    ),
  },
);

export type TourFlightResultsEntry = {
  id: string;
  tabLabel?: string;
  parsedSearch: ParsedFlightsSearch;
  subtitle?: string;
};

type TourFlightResultsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searches: TourFlightResultsEntry[];
  briefing?: TourFlightBriefing;
  title?: string;
  /** @deprecated use searches[].subtitle */
  subtitle?: string;
  /** @deprecated use searches */
  parsedSearch?: ParsedFlightsSearch | null;
};

function WhitelabelResults({ parsedSearch }: { parsedSearch: ParsedFlightsSearch }) {
  const widgetSearch = useMemo(() => {
    if (hasMinimumFlightsSearchParams(parsedSearch)) {
      return { ...parsedSearch, autoSearch: true };
    }
    return parsedSearch;
  }, [parsedSearch]);

  return (
    <TravelpayoutsFlightsWidgets
      key={buildWlWidgetRemountKey(widgetSearch)}
      parsedSearch={widgetSearch}
      urlSync="inline"
    />
  );
}

function formatIsoDateLabel(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

function formatSearchDateLabel(search: ParsedFlightsSearch): string | null {
  if (search.segments?.length) {
    const labels = search.segments
      .map((segment) => formatIsoDateLabel(segment.departDate))
      .filter(Boolean);
    return labels.length > 0 ? labels.join(" · ") : null;
  }

  if (!search.departDate) return null;
  const depart = formatIsoDateLabel(search.departDate);
  if (search.tripType === "round_trip" && search.returnDate) {
    return `${depart} — ${formatIsoDateLabel(search.returnDate)}`;
  }
  return depart;
}

export default function TourFlightResultsModal({
  open,
  onOpenChange,
  searches,
  briefing,
  title = "Результаты поиска",
  subtitle: legacySubtitle,
  parsedSearch: legacyParsedSearch,
}: TourFlightResultsModalProps) {
  const entries: TourFlightResultsEntry[] = useMemo(() => {
    if (searches.length > 0) return searches;
    if (legacyParsedSearch) {
      return [
        {
          id: "single",
          parsedSearch: legacyParsedSearch,
          subtitle: legacySubtitle,
        },
      ];
    }
    return [];
  }, [searches, legacyParsedSearch, legacySubtitle]);

  const complexSearch = useMemo(
    () => mergeTourFlightSearchesIntoComplex(entries.map((entry) => entry.parsedSearch)),
    [entries],
  );

  const [activeId, setActiveId] = useState(entries[0]?.id ?? "single");
  const showTabs = !complexSearch && entries.length > 1;

  const searchesKey = useMemo(
    () => entries.map((entry) => `${entry.id}:${entry.parsedSearch.departDate ?? ""}`).join("|"),
    [entries],
  );

  useEffect(() => {
    if (!open || entries.length === 0 || complexSearch) return;
    const preferred =
      entries.find((entry) => hasMinimumFlightsSearchParams(entry.parsedSearch))?.id ??
      entries[0]?.id;
    if (preferred) setActiveId(preferred);
  }, [open, searchesKey, entries, complexSearch]);

  useEffect(() => {
    if (open) return;
    restoreInlineWlSearchParams();
    return () => restoreInlineWlSearchParams();
  }, [open]);

  const activeEntry =
    entries.find((entry) => entry.id === activeId) ?? entries[0] ?? null;

  const widgetSearch = complexSearch ?? activeEntry?.parsedSearch ?? null;

  const activeCanAutoSearch = widgetSearch
    ? hasMinimumFlightsSearchParams(widgetSearch)
    : false;

  const activeDateLabel = widgetSearch ? formatSearchDateLabel(widgetSearch) : null;

  const activeSubtitle = complexSearch
    ? entries.map((entry) => entry.subtitle ?? `${entry.parsedSearch.origin} → ${entry.parsedSearch.destination}`).join(" · ")
    : activeEntry?.subtitle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        bottomSheet={false}
        showClose={false}
        className="fixed inset-0 z-[116] flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 p-0 sm:max-h-none sm:rounded-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {[activeSubtitle, activeDateLabel].filter(Boolean).join(" · ")}
          {[activeSubtitle, activeDateLabel].some(Boolean) ? " · " : ""}
          Выбирайте, пожалуйста, даты с запасом.
        </DialogDescription>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="tour-flight-modal-close h-11 w-11 rounded-full bg-white/95 shadow-md backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="tour-flight-modal-scroll min-h-0 flex-1 overflow-y-auto">
          <header className="tour-flight-modal-hero">
            <div
              className="tour-flight-modal-hero__glow tour-flight-modal-hero__glow--primary"
              aria-hidden
            />
            <div className="tour-flight-modal-hero__inner mx-auto w-full max-w-5xl">
              <h2 className="pr-10 text-base font-bold leading-tight text-charcoal sm:text-lg">
                {title}
              </h2>
              <p className="mt-0.5 text-xs text-slate sm:text-sm">
                Выбирайте, пожалуйста, даты с запасом
              </p>
              {briefing ? (
                <TourFlightModalTourContext
                  briefing={briefing}
                  variant="minimal"
                  className="mt-2"
                />
              ) : null}
            </div>
          </header>

          <div className="tour-flight-modal-search-shell mx-auto w-full max-w-5xl px-4 sm:px-6">
            {showTabs ? (
              <div
                className="mb-2 flex gap-1 rounded-lg bg-white/90 p-0.5 shadow-sm backdrop-blur-sm"
                role="tablist"
                aria-label="Направления перелёта"
              >
                {entries.map((entry) => {
                  const ready = hasMinimumFlightsSearchParams(entry.parsedSearch);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      role="tab"
                      aria-selected={entry.id === activeId}
                      className={cn(
                        "min-w-0 flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                        entry.id === activeId
                          ? "bg-white text-charcoal shadow-sm"
                          : "text-slate hover:text-charcoal",
                        !ready && entry.id !== activeId && "opacity-80",
                      )}
                      onClick={() => setActiveId(entry.id)}
                    >
                      <span>{entry.tabLabel ?? entry.subtitle ?? entry.id}</span>
                      {!ready ? (
                        <span className="mt-0.5 block text-[10px] font-normal text-amber-700">
                          Укажите дату
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!activeCanAutoSearch ? (
              <p className="mb-2 rounded-xl border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-charcoal/90">
                Укажите дату вылета и нажмите «Найти» — маршрут уже подставлен.
              </p>
            ) : null}

            {open && widgetSearch ? <WhitelabelResults parsedSearch={widgetSearch} /> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
