"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Calendar, Navigation, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import DateRangePicker from "./DateRangePicker";
import { cn } from "@/lib/cn";
import type { TourListing } from "@/types";
import {
  getSearchDestinationResults,
  type SearchDestinationResult,
} from "@/lib/search-destinations";
import { formatTours } from "@/lib/pluralize";

interface SearchBlockProps {
  tours: TourListing[];
  query: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  nearMe: boolean;
  onQueryChange: (q: string) => void;
  onDatesChange: (from: Date | null, to: Date | null) => void;
  onNearMe: (coords: { lat: number; lng: number } | null) => void;
  onSearch: () => void;
  /** When true, omits outer card chrome (for HomeMultiSearch). */
  embedded?: boolean;
}

function ClearButton({
  onClick,
  label,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function DestinationOption({
  destination,
  onSelect,
}: {
  destination: SearchDestinationResult;
  onSelect: (label: string) => void;
}) {
  return (
    <li className="border-t border-gray-100 first:border-t-0">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3.5 text-left transition-colors hover:bg-gray-50"
        onClick={() => onSelect(destination.label)}
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-charcoal">{destination.displayTitle}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate">{destination.subtitle}</p>
        </div>
        <span className="shrink-0 pt-0.5 text-sm tabular-nums text-slate">
          {formatTours(destination.tourCount)}
        </span>
      </button>
    </li>
  );
}

export default function SearchBlock({
  tours,
  query,
  dateFrom,
  dateTo,
  nearMe,
  onQueryChange,
  onDatesChange,
  onNearMe,
  onSearch,
  embedded = false,
}: SearchBlockProps) {
  const [destOpen, setDestOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const destPopoverRef = useRef<HTMLDivElement>(null);
  const destInteractedRef = useRef(false);

  useEffect(() => {
    if (!destOpen) return;

    const handleScroll = (event: Event) => {
      if (destInteractedRef.current) return;
      const target = event.target;
      if (target instanceof Node && destPopoverRef.current?.contains(target)) return;
      setDestOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, [destOpen]);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const destinations = useMemo(
    () =>
      getSearchDestinationResults(tours, {
        query,
        popularOnly: !isSearching,
        limit: isSearching ? 10 : 8,
      }),
    [tours, query, isSearching]
  );

  const dateLabel =
    dateFrom && dateTo
      ? `${format(dateFrom, "d MMM", { locale: ru })} – ${format(dateTo, "d MMM", { locale: ru })}`
      : dateFrom
        ? format(dateFrom, "d MMM yyyy", { locale: ru })
        : "Когда?";

  const hasDestination = Boolean(trimmedQuery) || nearMe;
  const hasDates = Boolean(dateFrom || dateTo);

  async function handleNearMe() {
    if (nearMe) {
      onNearMe(null);
      setGeoError(null);
      return;
    }
    if (!navigator.geolocation) {
      setGeoError("Геолокация недоступна в этом браузере. Выберите направление вручную.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onNearMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        onQueryChange("");
        setDestOpen(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGeoError("Не удалось определить местоположение. Разрешите доступ или выберите город.");
      }
    );
  }

  function clearDestination(e: React.MouseEvent) {
    e.stopPropagation();
    onQueryChange("");
    onNearMe(null);
  }

  function clearDates(e: React.MouseEvent) {
    e.stopPropagation();
    setDraftFrom(null);
    setDraftTo(null);
    onDatesChange(null, null);
  }

  function selectDestination(label: string) {
    onNearMe(null);
    onQueryChange(label);
    setDestOpen(false);
  }

  const form = (
    <>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        <Popover
          open={destOpen}
          onOpenChange={(open) => {
            setDestOpen(open);
            if (open) destInteractedRef.current = false;
          }}
        >
          <div className="flex flex-1 items-center rounded-2xl transition-colors hover:bg-gray-50">
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left lg:py-4"
              >
                <Search className="h-5 w-5 shrink-0 text-sky" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate">Направление</p>
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      hasDestination ? "text-charcoal" : "text-slate/70"
                    )}
                  >
                    {nearMe && !trimmedQuery
                      ? "Рядом со мной"
                      : query || "Куда поедем?"}
                  </p>
                </div>
              </button>
            </PopoverTrigger>
            {hasDestination && (
              <div className="pr-3">
                <ClearButton
                  onClick={clearDestination}
                  label="Сбросить направление"
                />
              </div>
            )}
          </div>
          <PopoverContent
            ref={destPopoverRef}
            side="bottom"
            align="start"
            avoidCollisions={false}
            sideOffset={8}
            className="flex max-h-[min(65dvh,calc(100dvh-env(keyboard-inset-height,0px)-6rem))] flex-col overflow-hidden p-0 sm:max-h-[min(420px,calc(100vh-12rem))] sm:w-[min(480px,calc(100dvw-2rem))]"
            onPointerDownCapture={() => {
              destInteractedRef.current = true;
            }}
          >
            <div className="shrink-0 border-b border-gray-100 p-4">
              <div className="relative">
                <Input
                  placeholder="Регион, город, парк или достопримечательность"
                  value={query}
                  onChange={(e) => {
                    destInteractedRef.current = true;
                    onQueryChange(e.target.value);
                  }}
                  autoFocus
                  className={query ? "pr-10" : undefined}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate hover:bg-gray-100 hover:text-charcoal"
                    aria-label="Очистить поле"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="shrink-0 border-b border-gray-100 px-3 py-1.5">
              <button
                type="button"
                onClick={handleNearMe}
                disabled={locating}
                aria-describedby="nearby-search-hint"
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-80",
                  nearMe
                    ? "bg-sky/10 text-sky-dark"
                    : "text-charcoal hover:bg-gray-50"
                )}
              >
                {locating ? (
                  <LoadingSpinner className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                <span className="truncate">
                  {locating ? "Определяем..." : nearMe ? "Рядом со мной ✓" : "Искать поблизости"}
                </span>
                {!locating && !nearMe ? (
                  <span id="nearby-search-hint" className="ml-auto shrink-0 text-[10px] text-slate">
                    до 1000 км
                  </span>
                ) : null}
              </button>
            </div>

            <div className="shrink-0 px-4 pt-3 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate/70">
                {isSearching ? "Лучшее совпадение" : "Популярное"}
              </p>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {destinations.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm leading-relaxed text-slate">
                  {isSearching ? (
                    <>
                      Ничего не нашли по запросу «{trimmedQuery}». Попробуйте город, регион или
                      название места — например, «Патагония» или «Перито-Морено».
                    </>
                  ) : (
                    <>Популярные направления скоро появятся в каталоге.</>
                  )}
                </li>
              ) : (
                destinations.map((destination) => (
                  <DestinationOption
                    key={destination.label}
                    destination={destination}
                    onSelect={selectDestination}
                  />
                ))
              )}
            </ul>
          </PopoverContent>
        </Popover>

        <div className="hidden w-px bg-gray-200 lg:block" />

        <Popover
          open={dateOpen}
          onOpenChange={(open) => {
            setDateOpen(open);
            if (open) {
              setDraftFrom(dateFrom);
              setDraftTo(dateTo);
            }
          }}
        >
          <div className="flex flex-1 items-center rounded-2xl transition-colors hover:bg-gray-50">
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left lg:py-4"
              >
                <Calendar className="h-5 w-5 shrink-0 text-sky" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate">Даты</p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      hasDates ? "text-charcoal" : "text-slate/70"
                    )}
                  >
                    {dateLabel}
                  </p>
                </div>
              </button>
            </PopoverTrigger>
            {hasDates && (
              <div className="pr-3">
                <ClearButton onClick={clearDates} label="Сбросить даты" />
              </div>
            )}
          </div>
          <PopoverContent
            align="start"
            collisionPadding={16}
            mobileFullWidth={false}
            className={cn(
              "overflow-y-auto overflow-x-hidden p-0",
              "max-sm:w-[calc(100dvw-2rem)] max-sm:max-w-[calc(100dvw-2rem)]",
              "sm:w-[42rem] sm:max-w-[min(calc(100dvw-2rem),42rem)]"
            )}
          >
            <DateRangePicker
              from={draftFrom}
              to={draftTo}
              onChange={(f, t) => {
                setDraftFrom(f);
                setDraftTo(t);
              }}
              onClear={() => {
                setDraftFrom(null);
                setDraftTo(null);
                onDatesChange(null, null);
                setDateOpen(false);
              }}
              onApply={() => {
                onDatesChange(draftFrom, draftTo);
                setDateOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          size="lg"
          className="h-auto rounded-2xl px-8 py-4 text-base lg:min-w-[200px]"
          onClick={(e) => {
            e.preventDefault();
            onSearch();
          }}
        >
          Найти путешествия
        </Button>
      </div>
      {geoError ? (
        <p className="mt-2 px-1 text-xs leading-relaxed text-amber-800" role="status">
          {geoError}
        </p>
      ) : null}
    </>
  );

  if (embedded) return form;

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-3 shadow-lg shadow-charcoal/5 sm:p-4">
      {form}
    </div>
  );
}
