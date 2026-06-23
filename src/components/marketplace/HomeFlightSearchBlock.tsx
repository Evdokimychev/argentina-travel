"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plane,
  Plus,
  Users,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CalendarMonthGrid from "@/components/ui/calendar-month-grid";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import type { FlightTripClass } from "@/lib/flights/wl-search-params";
import {
  DEFAULT_HOME_FLIGHT_DESTINATION,
  DEFAULT_HOME_FLIGHT_ORIGIN,
  getFlightHubLabel,
  getFlightHubPickerSections,
  type FlightHubOption,
  type FlightHubPickerSections,
} from "@/lib/flights/home-flight-hubs";
import { cn } from "@/lib/cn";
import { formatPassengers } from "@/lib/pluralize";
import type { LocaleCode } from "@/types/locale";

type HomeFlightSearchBlockProps = {
  routePreset?: { origin: string; destination: string } | null;
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

const MAX_PASSENGERS = 9;

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

function HubOptionButton({
  hub,
  onSelect,
}: {
  hub: FlightHubOption;
  onSelect: (code: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
        onClick={() => onSelect(hub.code)}
      >
        <span className="font-medium text-charcoal">{hub.label}</span>
        <span className="shrink-0 rounded-md bg-slate/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none tracking-wide text-slate">
          {hub.code}
        </span>
      </button>
    </li>
  );
}

function HubSectionHeading({ children }: { children: string }) {
  return (
    <li className="sticky top-0 z-10 bg-white px-3 pb-1 pt-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">{children}</p>
    </li>
  );
}

function filterHubSections(
  sections: FlightHubPickerSections,
  query: string,
): FlightHubPickerSections | null {
  const q = query.trim().toLowerCase();
  if (!q) return sections;

  const match = (hub: FlightHubOption) =>
    hub.label.toLowerCase().includes(q) || hub.code.toLowerCase().includes(q);

  return {
    popular: sections.popular.filter(match),
    all: sections.all.filter(match),
  };
}

function HubOptionsList({
  sections,
  onSelect,
}: {
  sections: FlightHubPickerSections;
  onSelect: (code: string) => void;
}) {
  const hasResults = sections.popular.length > 0 || sections.all.length > 0;

  if (!hasResults) {
    return <li className="px-3 py-6 text-center text-sm text-slate">Ничего не нашли</li>;
  }

  return (
    <>
      {sections.popular.length > 0 ? (
        <>
          <HubSectionHeading>Популярные</HubSectionHeading>
          {sections.popular.map((hub) => (
            <HubOptionButton key={`popular-${hub.code}`} hub={hub} onSelect={onSelect} />
          ))}
        </>
      ) : null}
      {sections.all.length > 0 ? (
        <>
          <HubSectionHeading>Все аэропорты</HubSectionHeading>
          {sections.all.map((hub) => (
            <HubOptionButton key={`all-${hub.code}`} hub={hub} onSelect={onSelect} />
          ))}
        </>
      ) : null}
    </>
  );
}

function HubValue({ code }: { code: string }) {
  return (
    <span className="truncate">
      {getFlightHubLabel(code)}
      <span className="ml-1 text-xs tabular-nums text-slate">{code}</span>
    </span>
  );
}

function HubPicker({
  kind,
  value,
  onChange,
  label,
  placeholder,
  compact,
}: {
  kind: "origin" | "destination";
  value: string;
  onChange: (code: string) => void;
  label: string;
  placeholder: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const sections = useMemo(() => getFlightHubPickerSections(kind), [kind]);
  const filteredSections = useMemo(
    () => filterHubSections(sections, query),
    [sections, query],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50/80 sm:px-4 lg:py-3",
            compact && "lg:py-2.5",
          )}
        >
          <Plane
            className={cn(
              "h-4 w-4 shrink-0 text-sky",
              kind === "destination" && "rotate-90",
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate">{label}</p>
            <p
              className={cn(
                "truncate text-sm font-medium leading-snug",
                value ? "text-charcoal" : "text-slate/70",
              )}
            >
              {value ? <HubValue code={value} /> : placeholder}
            </p>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        avoidCollisions={false}
        sideOffset={8}
        className="flex max-h-[min(360px,calc(100vh-12rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden p-0"
      >
        <div className="shrink-0 border-b border-gray-100 p-3">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            className="h-9"
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filteredSections ? (
            <HubOptionsList
              sections={filteredSections}
              onSelect={(code) => {
                onChange(code);
                setOpen(false);
                setQuery("");
              }}
            />
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function FlightDateRangePicker({
  from,
  to,
  onChange,
  onApply,
  onClear,
  hint,
  clearLabel,
  applyLabel,
}: {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
  onApply: () => void;
  onClear: () => void;
  hint: string;
  clearLabel: string;
  applyLabel: string;
}) {
  const [month, setMonth] = useState(from ?? defaultDepartDate());
  const secondMonth = addMonths(month, 1);

  function handleDayClick(day: Date) {
    const clicked = startOfDay(day);
    const rangeStart = from ? startOfDay(from) : null;

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
            rangeFrom={from}
            rangeTo={to}
            disablePast
            onDayClick={handleDayClick}
            className="w-full min-w-0 px-2 sm:px-3 md:w-[252px] md:shrink-0"
          />
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

export default function HomeFlightSearchBlock({ routePreset }: HomeFlightSearchBlockProps) {
  const router = useRouter();
  const { t, locale } = useLocaleCurrency();
  const [origin, setOrigin] = useState(DEFAULT_HOME_FLIGHT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_HOME_FLIGHT_DESTINATION);
  const [departDate, setDepartDate] = useState<Date | null>(() => defaultDepartDate());
  const [returnDate, setReturnDate] = useState<Date | null>(() =>
    defaultReturnDate(defaultDepartDate()),
  );
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [tripClass, setTripClass] = useState<FlightTripClass>(0);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [draftDepart, setDraftDepart] = useState<Date | null>(departDate);
  const [draftReturn, setDraftReturn] = useState<Date | null>(returnDate);

  useEffect(() => {
    if (!routePreset) return;
    setOrigin(routePreset.origin);
    setDestination(routePreset.destination);
  }, [routePreset]);

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

  function updateAdults(next: number) {
    const clamped = Math.min(maxAdults, Math.max(1, next));
    setAdults(clamped);
    if (infants > clamped) setInfants(clamped);
  }

  function updateChildren(next: number) {
    setChildren(Math.min(maxChildren, Math.max(0, next)));
  }

  function updateInfants(next: number) {
    setInfants(Math.min(maxInfants, Math.max(0, next)));
  }

  const hasDates = Boolean(departDate);
  const roundTrip = isRoundTrip(departDate, returnDate);

  const dateLabel = useMemo(() => {
    if (!departDate) return t("flights.form.datesPlaceholder");
    if (roundTrip && returnDate) {
      return `${format(departDate, "d MMM", { locale: ru })} – ${format(returnDate, "d MMM", { locale: ru })}`;
    }
    return format(departDate, "d MMM yyyy", { locale: ru });
  }, [departDate, returnDate, roundTrip, t]);

  const dateSubLabel = useMemo(() => {
    if (!departDate) return null;
    return roundTrip ? t("flights.form.roundTrip") : t("flights.form.oneWay");
  }, [departDate, roundTrip, t]);

  function handleSearch() {
    if (!origin || !destination) return;

    const departIso = departDate ? format(departDate, "yyyy-MM-dd") : undefined;
    const returnIso =
      roundTrip && returnDate ? format(returnDate, "yyyy-MM-dd") : undefined;

    const href = buildFlightsSearchHref(origin, destination, {
      departDate: departIso,
      returnDate: returnIso,
      adults,
      children,
      infants,
      tripClass,
      autoSearch: Boolean(departIso),
    });
    router.push(href);
  }

  function swapEndpoints() {
    setOrigin(destination);
    setDestination(origin);
  }

  function clearDates(e: React.MouseEvent) {
    e.stopPropagation();
    setDepartDate(null);
    setReturnDate(null);
    setDraftDepart(null);
    setDraftReturn(null);
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {/* Origin ↔ destination */}
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-sky/15 bg-sky/[0.03] sm:flex-row sm:items-stretch lg:max-w-none">
        <HubPicker
          kind="origin"
          value={origin}
          onChange={setOrigin}
          label={t("flights.form.origin")}
          placeholder={t("flights.form.originPlaceholder")}
          compact
        />
        <div className="relative flex shrink-0 items-center justify-center sm:w-10">
          <div className="absolute inset-x-3 top-0 h-px bg-gray-200 sm:inset-y-0 sm:left-1/2 sm:h-auto sm:w-px sm:-translate-x-1/2" />
          <button
            type="button"
            onClick={swapEndpoints}
            className="relative z-10 my-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-sky shadow-sm transition-colors hover:border-sky/30 hover:bg-sky/5 sm:my-0"
            aria-label={t("flights.form.swap")}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </button>
        </div>
        <HubPicker
          kind="destination"
          value={destination}
          onChange={setDestination}
          label={t("flights.form.destination")}
          placeholder={t("flights.form.destinationPlaceholder")}
          compact
        />
      </div>

      <div className="hidden w-px bg-gray-200 lg:block" />

      {/* Dates */}
      <Popover
        open={dateOpen}
        onOpenChange={(open) => {
          setDateOpen(open);
          if (open) {
            setDraftDepart(departDate);
            setDraftReturn(returnDate);
          }
        }}
      >
        <div className="flex min-w-0 flex-1 items-center rounded-2xl transition-colors hover:bg-gray-50 lg:max-w-[240px] xl:max-w-[260px]">
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left sm:px-4 lg:py-3"
            >
              <Calendar className="h-4 w-4 shrink-0 text-sky" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate">{t("flights.form.dates")}</p>
                <p
                  className={cn(
                    "truncate text-sm font-medium leading-snug",
                    hasDates ? "text-charcoal" : "text-slate/70",
                  )}
                >
                  {dateLabel}
                </p>
                {dateSubLabel ? (
                  <p className="truncate text-[10px] font-medium text-sky-dark/80">{dateSubLabel}</p>
                ) : null}
              </div>
            </button>
          </PopoverTrigger>
          {hasDates ? (
            <div className="pr-2 sm:pr-3">
              <ClearButton onClick={clearDates} label={t("flights.form.clearDates")} />
            </div>
          ) : null}
        </div>
        <PopoverContent
          align="start"
          collisionPadding={16}
          className="max-h-[min(90vh,var(--radix-popover-content-available-height))] w-[calc(100vw-2rem)] max-w-[580px] overflow-y-auto p-0"
        >
          <FlightDateRangePicker
            from={draftDepart}
            to={draftReturn}
            onChange={(from, to) => {
              setDraftDepart(from);
              setDraftReturn(to);
            }}
            onClear={() => {
              setDraftDepart(null);
              setDraftReturn(null);
              setDepartDate(null);
              setReturnDate(null);
              setDateOpen(false);
            }}
            onApply={() => {
              setDepartDate(draftDepart);
              setReturnDate(draftReturn);
              setDateOpen(false);
            }}
            hint={t("flights.form.datesHint")}
            clearLabel={t("flights.form.clearDates")}
            applyLabel={t("flights.form.applyDates")}
          />
        </PopoverContent>
      </Popover>

      <div className="hidden w-px bg-gray-200 lg:block" />

      {/* Passengers */}
      <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
        <div className="flex min-w-0 items-center rounded-2xl transition-colors hover:bg-gray-50 lg:w-auto lg:min-w-[150px] lg:flex-none">
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left sm:px-4 lg:py-3"
            >
              <Users className="h-4 w-4 shrink-0 text-sky" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate">{t("flights.form.passengers")}</p>
                <p className="truncate text-sm font-medium leading-snug text-charcoal">
                  {passengersLabel}
                </p>
                <p className="truncate text-[10px] font-medium text-sky-dark/80">{tripClassLabel}</p>
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
              onChange={updateAdults}
              decrementLabel={`${t("flights.form.adults")} −`}
              incrementLabel={`${t("flights.form.adults")} +`}
            />
            <PassengerCounterRow
              label={t("flights.form.children")}
              hint={t("flights.form.childrenAgeHint")}
              value={children}
              min={0}
              max={maxChildren}
              onChange={updateChildren}
              decrementLabel={`${t("flights.form.children")} −`}
              incrementLabel={`${t("flights.form.children")} +`}
            />
            <PassengerCounterRow
              label={t("flights.form.infantsLabel")}
              hint={t("flights.form.infantsAgeHint")}
              value={infants}
              min={0}
              max={maxInfants}
              onChange={updateInfants}
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

      {/* Search */}
      <Button
        type="button"
        size="lg"
        className="h-auto w-full rounded-2xl px-8 py-3 text-base lg:w-auto lg:min-w-[200px] lg:flex-none lg:py-3.5"
        onClick={handleSearch}
        disabled={!origin || !destination}
      >
        {t("flights.form.search")}
      </Button>
    </div>
  );
}
