"use client";

import { useMemo, useState } from "react";
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
}: SearchBlockProps) {
  const [destOpen, setDestOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);
  const [locating, setLocating] = useState(false);

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
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onNearMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        onQueryChange("");
        setDestOpen(false);
        setLocating(false);
      },
      () => setLocating(false)
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

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-3 shadow-lg shadow-charcoal/5 sm:p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        <Popover open={destOpen} onOpenChange={(open) => setDestOpen(open)}>
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
                      hasDestination ? "text-charcoal" : "text-gray-400"
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
            side="bottom"
            align="start"
            avoidCollisions={false}
            sideOffset={8}
            className="flex max-h-[min(420px,calc(100vh-12rem))] w-[min(480px,calc(100vw-2rem))] flex-col overflow-hidden p-0"
          >
            <div className="shrink-0 border-b border-gray-100 p-4">
              <div className="relative">
                <Input
                  placeholder="Регион, город, парк или достопримечательность"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
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

            <div className="shrink-0 px-4 pt-4">
              <button
                type="button"
                onClick={handleNearMe}
                disabled={locating}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-80",
                  nearMe
                    ? "bg-sky/10 text-sky-dark"
                    : "bg-gray-100 text-charcoal hover:bg-gray-200/80"
                )}
              >
                {locating ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <Navigation className="h-4 w-4 shrink-0" />
                )}
                {locating ? "Определяем..." : nearMe ? "Рядом со мной ✓" : "Искать поблизости"}
              </button>
              <p className="mt-2 px-1 text-center text-xs leading-relaxed text-slate">
                Покажем все туры на расстоянии до 1000 километров от вас
              </p>
            </div>

            <div className="shrink-0 px-4 pt-5 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
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
                      hasDates ? "text-charcoal" : "text-gray-400"
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
            className="max-h-[min(90vh,var(--radix-popover-content-available-height))] w-[calc(100vw-2rem)] max-w-[580px] overflow-y-auto p-0"
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
    </div>
  );
}
