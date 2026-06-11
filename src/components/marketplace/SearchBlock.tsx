"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, Calendar, Navigation, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEARCH_DESTINATIONS } from "@/data/filters";
import DateRangePicker from "./DateRangePicker";
import { cn } from "@/lib/cn";

interface SearchBlockProps {
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

export default function SearchBlock({
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

  const suggestions = useMemo(() => {
    if (!query.trim()) return SEARCH_DESTINATIONS.slice(0, 8);
    const q = query.toLowerCase();
    return SEARCH_DESTINATIONS.filter((d) =>
      d.label.toLowerCase().includes(q)
    );
  }, [query]);

  const dateLabel =
    dateFrom && dateTo
      ? `${format(dateFrom, "d MMM", { locale: ru })} – ${format(dateTo, "d MMM", { locale: ru })}`
      : dateFrom
        ? format(dateFrom, "d MMM yyyy", { locale: ru })
        : "Когда?";

  const hasDestination = Boolean(query.trim()) || nearMe;
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
                    {nearMe && !query.trim()
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
          <PopoverContent className="w-[min(480px,calc(100vw-2rem))] p-0" align="start">
            <div className="border-b border-gray-100 p-4">
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
              <button
                type="button"
                onClick={handleNearMe}
                disabled={locating}
                className={cn(
                  "mt-3 flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  nearMe
                    ? "border-sky/30 bg-sky/10 text-sky-dark"
                    : "border-gray-200 hover:border-sky/30 hover:text-sky"
                )}
              >
                <Navigation className="h-4 w-4" />
                {locating ? "Определяем..." : nearMe ? "Рядом со мной ✓" : "Рядом со мной"}
              </button>
            </div>
            <ul className="max-h-64 overflow-y-auto p-2">
              {suggestions.map((d) => (
                <li key={d.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                    onClick={() => {
                      onQueryChange(d.label);
                      setDestOpen(false);
                    }}
                  >
                    <MapPin className="h-4 w-4 text-slate" />
                    <div>
                      <p className="font-medium text-charcoal">{d.label}</p>
                      <p className="text-xs text-slate">
                        {d.region} ·{" "}
                        {d.type === "park"
                          ? "Нац. парк"
                          : d.type === "landmark"
                            ? "Достопримечательность"
                            : "Город"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
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
            className="w-[calc(100vw-2rem)] max-w-[580px] p-0"
            align="start"
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
