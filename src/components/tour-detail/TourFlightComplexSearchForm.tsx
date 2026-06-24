"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Users,
  X,
} from "lucide-react";
import { FlightRouteRow } from "@/components/flights/flight-hub-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import CalendarMonthGrid from "@/components/ui/calendar-month-grid";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { TourFlightFormSegment } from "@/lib/flights/tour-flight-prefill";
import type { FlightTripClass } from "@/lib/flights/wl-search-params";
import { cn } from "@/lib/cn";
import { formatPassengers } from "@/lib/pluralize";
import type { LocaleCode } from "@/types/locale";

const MAX_PASSENGERS = 9;

export type TourFlightComplexSearchSubmit = {
  id: string;
  tabLabel?: string;
  subtitle: string;
  params: {
    origin: string;
    destination: string;
    departDate?: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    tripClass: FlightTripClass;
    oneWay: boolean;
  };
};

type TourFlightComplexSearchFormProps = {
  segments: TourFlightFormSegment[];
  initialAdults?: number;
  emptyDates?: boolean;
  onSearch: (searches: TourFlightComplexSearchSubmit[]) => void;
  className?: string;
};

type SegmentState = {
  origin: string;
  destination: string;
  departDate: Date | null;
  returnDate: Date | null;
};

function defaultDepartDate(): Date {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() + 14);
  return date;
}

function defaultReturnDate(depart: Date): Date {
  const date = startOfDay(depart);
  date.setDate(date.getDate() + 7);
  return date;
}

function isRoundTrip(depart: Date | null, returnDate: Date | null): boolean {
  return Boolean(depart && returnDate && !isSameDay(depart, returnDate));
}

function formatPassengersLabel(count: number, locale: LocaleCode): string {
  if (locale === "ru") return formatPassengers(count);
  if (locale === "es") {
    return count === 1 ? "1 pasajero" : `${count} pasajeros`;
  }
  if (locale === "pt") {
    return count === 1 ? "1 passageiro" : `${count} passageiros`;
  }
  return count === 1 ? "1 passenger" : `${count} passengers`;
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

function PassengerCounterRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  decrementLabel,
  incrementLabel,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decrementLabel: string;
  incrementLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <p className="text-xs text-slate">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-charcoal transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={decrementLabel}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums text-charcoal">
          {value}
        </span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-white transition-colors hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={incrementLabel}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FlightClassRadio({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2.5">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          checked ? "border-sky bg-sky" : "border-gray-300 bg-white",
        )}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
      <span className="text-sm font-medium text-charcoal">{label}</span>
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onSelect}
      />
    </label>
  );
}

function SegmentDateRangePicker({
  from,
  to,
  onChange,
  onApply,
  onClear,
  hint,
  clearLabel,
  applyLabel,
  oneWay,
}: {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
  onApply: () => void;
  onClear: () => void;
  hint: string;
  clearLabel: string;
  applyLabel: string;
  oneWay: boolean;
}) {
  const [month, setMonth] = useState(from ?? defaultDepartDate());
  const secondMonth = addMonths(month, 1);

  function handleDayClick(day: Date) {
    const clicked = startOfDay(day);
    const rangeStart = from ? startOfDay(from) : null;

    if (oneWay) {
      onChange(clicked, null);
      return;
    }

    if (!rangeStart || (rangeStart && to)) {
      onChange(clicked, null);
    } else if (isBefore(clicked, rangeStart)) {
      onChange(clicked, rangeStart);
    } else if (isSameDay(clicked, rangeStart)) {
      onChange(rangeStart, null);
    } else {
      onChange(rangeStart, clicked);
    }
  }

  return (
    <div className="w-full max-w-[580px]">
      <p className="border-b border-gray-100 px-4 py-2.5 text-xs leading-relaxed text-slate">
        {hint}
      </p>
      <div className="flex items-start border-b border-gray-100 py-2">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-5 w-5 text-charcoal" />
        </button>

        <div className="flex min-w-0 flex-1 justify-center md:divide-x md:divide-gray-100">
          <CalendarMonthGrid
            month={month}
            rangeFrom={oneWay ? undefined : from}
            rangeTo={oneWay ? undefined : to}
            selected={oneWay ? from : undefined}
            disablePast
            onDayClick={handleDayClick}
            className="w-full min-w-0 px-2 sm:px-3 md:w-[252px] md:shrink-0"
          />
          {!oneWay ? (
            <div className="hidden md:block">
              <CalendarMonthGrid
                month={secondMonth}
                rangeFrom={from}
                rangeTo={to}
                disablePast
                onDayClick={handleDayClick}
                className="w-full min-w-0 px-2 sm:px-3 md:w-[252px] md:shrink-0"
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="h-5 w-5 text-charcoal" />
        </button>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-b-2xl">
        <Button variant="secondary" className="h-11 rounded-none" onClick={onClear}>
          {clearLabel}
        </Button>
        <Button className="h-11 rounded-none" onClick={onApply}>
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}

type ActiveRow = {
  segment: TourFlightFormSegment;
  state: SegmentState;
};

function buildActiveRows(
  segmentList: TourFlightFormSegment[],
  emptyDates: boolean,
): ActiveRow[] {
  return segmentList.map((segment) => ({
    segment,
    state: buildInitialSegmentState(segment, emptyDates),
  }));
}

function syncActiveRowsWithSegments(
  prev: ActiveRow[],
  segmentList: TourFlightFormSegment[],
  emptyDates: boolean,
): ActiveRow[] {
  const segmentById = new Map(segmentList.map((segment) => [segment.id, segment]));

  const synced = prev
    .filter((row) => segmentById.has(row.segment.id))
    .map((row) => {
      const nextSegment = segmentById.get(row.segment.id)!;
      const freshState = buildInitialSegmentState(nextSegment, emptyDates);
      const keepUserState =
        row.state.origin !== row.segment.origin ||
        row.state.destination !== row.segment.destination ||
        row.state.departDate != null ||
        row.state.returnDate != null;

      return {
        segment: nextSegment,
        state: keepUserState ? row.state : freshState,
      };
    });

  if (synced.length > 0) return synced;
  return buildActiveRows(segmentList, emptyDates);
}

function buildInitialSegmentState(
  segment: TourFlightFormSegment,
  emptyDates: boolean,
): SegmentState {
  const isRoundtrip = segment.kind === "roundtrip";
  const depart = segment.departDate ?? (emptyDates ? null : defaultDepartDate());
  const ret =
    isRoundtrip && segment.returnDate
      ? segment.returnDate
      : isRoundtrip && depart && !emptyDates
        ? defaultReturnDate(depart)
        : null;

  return {
    origin: segment.origin,
    destination: segment.destination,
    departDate: depart,
    returnDate: ret,
  };
}

export default function TourFlightComplexSearchForm({
  segments,
  initialAdults,
  emptyDates = false,
  onSearch,
  className,
}: TourFlightComplexSearchFormProps) {
  const { t, locale } = useLocaleCurrency();
  const [activeRows, setActiveRows] = useState<ActiveRow[]>(() =>
    buildActiveRows(segments, emptyDates),
  );
  const [adults, setAdults] = useState(() =>
    Math.min(MAX_PASSENGERS, Math.max(1, initialAdults ?? 1)),
  );
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [tripClass, setTripClass] = useState<FlightTripClass>(0);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [dateOpenId, setDateOpenId] = useState<string | null>(null);
  const [draftDates, setDraftDates] = useState<{ depart: Date | null; return: Date | null }>({
    depart: null,
    return: null,
  });

  useEffect(() => {
    setActiveRows((prev) => syncActiveRowsWithSegments(prev, segments, emptyDates));
  }, [segments, emptyDates]);

  useEffect(() => {
    if (emptyDates) return;
    setActiveRows((prev) =>
      prev.map((row) => {
        const freshState = buildInitialSegmentState(row.segment, false);
        const hasUserDates = row.state.departDate != null || row.state.returnDate != null;
        if (hasUserDates) return row;
        return { segment: row.segment, state: freshState };
      }),
    );
  }, [emptyDates]);

  const removedSegments = useMemo(
    () =>
      segments.filter(
        (segment) => !activeRows.some((row) => row.segment.id === segment.id),
      ),
    [segments, activeRows],
  );

  const canRemoveSegment = activeRows.length > 1;

  useEffect(() => {
    if (initialAdults == null) return;
    setAdults(Math.min(MAX_PASSENGERS, Math.max(1, initialAdults)));
  }, [initialAdults]);

  const totalPassengers = adults + children + infants;

  const passengersLabel = useMemo(
    () => formatPassengersLabel(totalPassengers, locale),
    [totalPassengers, locale],
  );

  const tripClassLabel = useMemo(
    () =>
      tripClass === 1
        ? t("flights.form.classBusinessShort")
        : t("flights.form.classEconomyShort"),
    [tripClass, t],
  );

  const maxChildren = Math.max(0, MAX_PASSENGERS - adults - infants);
  const maxInfants = Math.min(adults, MAX_PASSENGERS - adults - children);
  const maxAdults = Math.max(1, MAX_PASSENGERS - children - infants);

  function updateSegment(index: number, patch: Partial<SegmentState>) {
    setActiveRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, state: { ...row.state, ...patch } } : row,
      ),
    );
  }

  function removeSegment(index: number) {
    if (activeRows.length <= 1) return;
    setActiveRows((prev) => prev.filter((_, i) => i !== index));
    setDateOpenId(null);
  }

  function restoreSegment(segment: TourFlightFormSegment) {
    setActiveRows((prev) => [
      ...prev,
      { segment, state: buildInitialSegmentState(segment, emptyDates) },
    ]);
  }

  function handleSearch() {
    const searches: TourFlightComplexSearchSubmit[] = activeRows.map(({ segment, state }) => {
      const isRoundtrip = segment.kind === "roundtrip";
      const roundTrip = isRoundtrip && isRoundTrip(state.departDate, state.returnDate);
      const departIso = state.departDate ? format(state.departDate, "yyyy-MM-dd") : undefined;
      const returnIso =
        roundTrip && state.returnDate ? format(state.returnDate, "yyyy-MM-dd") : undefined;

      return {
        id: segment.id,
        tabLabel: segment.tabLabel,
        subtitle: `${state.origin} → ${state.destination}`,
        params: {
          origin: state.origin,
          destination: state.destination,
          departDate: departIso,
          returnDate: returnIso,
          adults,
          children,
          infants,
          tripClass,
          oneWay: !isRoundtrip || !returnIso,
        },
      };
    });

    if (searches.length === 0) return;
    onSearch(searches);
  }

  const canSearch = activeRows.every(
    ({ state }) => state.origin && state.destination && state.departDate,
  );
  const missingDates = activeRows.some(({ state }) => !state.departDate);

  return (
    <div className={cn("", className)}>
      {activeRows.map(({ segment, state }, index) => {
        const isRoundtrip = segment.kind === "roundtrip";
        const hasDates = Boolean(state.departDate);
        const roundTrip = isRoundtrip && isRoundTrip(state.departDate, state.returnDate);

        const dateLabel = !state.departDate
          ? t("flights.form.datesPlaceholder")
          : roundTrip && state.returnDate
            ? `${format(state.departDate!, "d MMM", { locale: ru })} – ${format(state.returnDate, "d MMM", { locale: ru })}`
            : format(state.departDate!, "d MMM yyyy", { locale: ru });

        const dateSubLabel = state.departDate
          ? roundTrip
            ? t("flights.form.roundTrip")
            : t("flights.form.oneWay")
          : null;

        return (
          <div
            key={segment.id}
            className={cn(
              "grid grid-cols-1 border-b border-gray-100 sm:grid-cols-[minmax(0,1fr)_11rem_auto] lg:grid-cols-[minmax(0,1fr)_12.5rem_auto]",
            )}
          >
            <FlightRouteRow
              origin={state.origin}
              destination={state.destination}
              onOriginChange={(code) => updateSegment(index, { origin: code })}
              onDestinationChange={(code) => updateSegment(index, { destination: code })}
              compact
              className="min-w-0 border-0 bg-transparent shadow-none"
            />

            <Popover
              open={dateOpenId === segment.id}
              onOpenChange={(open) => {
                if (open) {
                  setDateOpenId(segment.id);
                  setDraftDates({
                    depart: state.departDate,
                    return: state.returnDate,
                  });
                } else {
                  setDateOpenId(null);
                }
              }}
            >
              <div className="flex min-w-0 items-center border-t border-gray-100 sm:border-l sm:border-t-0">
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50/60"
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-sky" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-slate">
                        {isRoundtrip ? t("flights.form.dates") : "Дата вылета"}
                      </p>
                      <p
                        className={cn(
                          "truncate text-sm font-medium leading-snug",
                          hasDates ? "text-charcoal" : "text-slate/70",
                        )}
                      >
                        {dateLabel}
                      </p>
                      {dateSubLabel ? (
                        <p className="truncate text-[10px] font-medium text-sky-dark/80">
                          {dateSubLabel}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </PopoverTrigger>
                {hasDates ? (
                  <div className="pr-1.5">
                    <ClearButton
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSegment(index, { departDate: null, returnDate: null });
                      }}
                      label={t("flights.form.clearDates")}
                    />
                  </div>
                ) : null}
              </div>
              <PopoverContent
                align="start"
                collisionPadding={16}
                className="max-h-[min(90vh,var(--radix-popover-content-available-height))] w-[calc(100vw-2rem)] max-w-[580px] overflow-y-auto p-0"
              >
                <SegmentDateRangePicker
                  from={draftDates.depart}
                  to={draftDates.return}
                  oneWay={!isRoundtrip}
                  onChange={(from, to) => setDraftDates({ depart: from, return: to })}
                  onClear={() => {
                    updateSegment(index, { departDate: null, returnDate: null });
                    setDateOpenId(null);
                  }}
                  onApply={() => {
                    updateSegment(index, {
                      departDate: draftDates.depart,
                      returnDate: isRoundtrip ? draftDates.return : null,
                    });
                    setDateOpenId(null);
                  }}
                  hint={t("flights.form.datesHint")}
                  clearLabel={t("flights.form.clearDates")}
                  applyLabel={t("flights.form.applyDates")}
                />
              </PopoverContent>
            </Popover>

            {canRemoveSegment ? (
              <div className="flex items-center justify-center border-t border-gray-100 px-2 py-2 sm:border-l sm:border-t-0">
                <button
                  type="button"
                  onClick={() => removeSegment(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Убрать перелёт: ${segment.tabLabel ?? state.origin}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
          <div className="flex min-w-0 flex-1 items-center sm:max-w-[14rem]">
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50"
              >
                <Users className="h-4 w-4 shrink-0 text-sky" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-charcoal">
                    {passengersLabel}, {tripClassLabel.toLowerCase()}
                  </p>
                </div>
              </button>
            </PopoverTrigger>
          </div>
          <PopoverContent align="start" className="w-[min(100vw-2rem,320px)] p-0">
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                {t("flights.form.passengersCountSection")}
              </p>
            </div>
            <div className="divide-y divide-gray-100 px-4">
              <PassengerCounterRow
                label={t("flights.form.adults")}
                hint={t("flights.form.adultsAgeHint")}
                value={adults}
                min={1}
                max={maxAdults}
                onChange={(next) => {
                  const clamped = Math.min(maxAdults, Math.max(1, next));
                  setAdults(clamped);
                  if (infants > clamped) setInfants(clamped);
                }}
                decrementLabel={`${t("flights.form.adults")} −`}
                incrementLabel={`${t("flights.form.adults")} +`}
              />
              <PassengerCounterRow
                label={t("flights.form.children")}
                hint={t("flights.form.childrenAgeHint")}
                value={children}
                min={0}
                max={maxChildren}
                onChange={(next) => setChildren(Math.min(maxChildren, Math.max(0, next)))}
                decrementLabel={`${t("flights.form.children")} −`}
                incrementLabel={`${t("flights.form.children")} +`}
              />
              <PassengerCounterRow
                label={t("flights.form.infantsLabel")}
                hint={t("flights.form.infantsAgeHint")}
                value={infants}
                min={0}
                max={maxInfants}
                onChange={(next) => setInfants(Math.min(maxInfants, Math.max(0, next)))}
                decrementLabel={`${t("flights.form.infantsLabel")} −`}
                incrementLabel={`${t("flights.form.infantsLabel")} +`}
              />
            </div>
            <div className="mt-1 border-t border-gray-100 px-4 pt-3 pb-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate">
                {t("flights.form.flightClassSection")}
              </p>
              <FlightClassRadio
                label={t("flights.form.classEconomy")}
                checked={tripClass === 0}
                onSelect={() => setTripClass(0)}
              />
              <FlightClassRadio
                label={t("flights.form.classBusiness")}
                checked={tripClass === 1}
                onSelect={() => setTripClass(1)}
              />
            </div>
          </PopoverContent>
        </Popover>

          {removedSegments.length > 0 ? (
            <button
              type="button"
              onClick={() => restoreSegment(removedSegments[0]!)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-slate transition-colors hover:bg-gray-50 hover:text-sky"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Добавить перелёт
            </button>
          ) : null}
        </div>

        <Button
          type="button"
          className="h-10 w-full rounded-lg sm:ml-auto sm:w-auto sm:min-w-[10.5rem]"
          onClick={handleSearch}
          disabled={!canSearch}
        >
          Найти билеты
        </Button>
      </div>
      {missingDates ? (
        <p className="px-2 pb-1 text-[11px] leading-relaxed text-slate">
          Укажите дату вылета для каждого перелёта — без неё поиск недоступен.
        </p>
      ) : null}
    </div>
  );
}
