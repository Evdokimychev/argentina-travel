"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Plane, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  getFlightHubLabel,
  getFlightHubPickerSections,
  type FlightHubOption,
  type FlightHubPickerSections,
} from "@/lib/flights/home-flight-hubs";
import { formatAirportPickerFromIata } from "@/lib/geo/format";
import { cn } from "@/lib/cn";

function HubOptionButton({
  hub,
  onSelect,
}: {
  hub: FlightHubOption;
  onSelect: (code: string) => void;
}) {
  const lines = formatAirportPickerFromIata(hub.code);

  return (
    <li>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
        onClick={() => onSelect(hub.code)}
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-charcoal">{lines.cityLine}</span>
          <span className="mt-0.5 block text-xs text-slate">{lines.airportLine}</span>
        </span>
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

  const match = (hub: FlightHubOption) => {
    const lines = formatAirportPickerFromIata(hub.code);
    const haystack = [hub.label, hub.code, lines.cityLine, lines.airportLine].join(" ").toLowerCase();
    return haystack.includes(q);
  };

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
  const lines = formatAirportPickerFromIata(code);

  return (
    <span className="truncate">
      <span className="block truncate">{lines.cityLine}</span>
      <span className="block truncate text-xs font-normal text-slate">{lines.airportLine}</span>
    </span>
  );
}

export function HubPicker({
  kind,
  value,
  onChange,
  label,
  placeholder,
  compact,
  triggerClassName,
}: {
  kind: "origin" | "destination";
  value: string;
  onChange: (code: string) => void;
  label: string;
  placeholder: string;
  compact?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [query, setQuery] = useState("");
  const sections = useMemo(() => getFlightHubPickerSections(kind), [kind]);
  const filteredSections = useMemo(
    () => filterHubSections(sections, query),
    [sections, query],
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchEnabled(false);
      setQuery("");
    }
  }

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setSearchEnabled(false);
    setQuery("");
  }

  function enableSearch() {
    setSearchEnabled(true);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50/80 sm:px-4 lg:py-3",
            compact && "lg:py-2.5",
            triggerClassName,
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
        className="flex max-h-[min(360px,calc(100vh-12rem))] flex-col overflow-hidden p-0 sm:w-[min(360px,calc(100dvw-2rem))]"
      >
        {searchEnabled ? (
          <div className="shrink-0 border-b border-gray-100 p-3">
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9"
            />
          </div>
        ) : (
          <div className="shrink-0 border-b border-gray-100 p-3">
            <button
              type="button"
              onClick={enableSearch}
              className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-slate transition-colors hover:border-sky/30 hover:bg-sky/[0.03]"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              Искать…
            </button>
          </div>
        )}
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filteredSections ? (
            <HubOptionsList sections={filteredSections} onSelect={handleSelect} />
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

type FlightRouteRowProps = {
  origin: string;
  destination: string;
  onOriginChange: (code: string) => void;
  onDestinationChange: (code: string) => void;
  compact?: boolean;
  className?: string;
};

export function FlightRouteRow({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  compact = false,
  className,
}: FlightRouteRowProps) {
  const { t } = useLocaleCurrency();

  function swapEndpoints() {
    onOriginChange(destination);
    onDestinationChange(origin);
  }

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 flex-col rounded-2xl border border-sky/15 bg-sky/[0.03] sm:flex-row sm:items-stretch",
        className,
      )}
    >
      <HubPicker
        kind="origin"
        value={origin}
        onChange={onOriginChange}
        label={t("flights.form.origin")}
        placeholder={t("flights.form.originPlaceholder")}
        compact={compact}
        triggerClassName="max-sm:border-b max-sm:border-gray-200 max-sm:pr-11"
      />
      <div className="relative hidden shrink-0 items-center justify-center sm:flex sm:w-10">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-200" />
        <button
          type="button"
          onClick={swapEndpoints}
          className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-sky shadow-sm transition-colors hover:border-sky/30 hover:bg-sky/5"
          aria-label={t("flights.form.swap")}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </button>
      </div>
      <HubPicker
        kind="destination"
        value={destination}
        onChange={onDestinationChange}
        label={t("flights.form.destination")}
        placeholder={t("flights.form.destinationPlaceholder")}
        compact={compact}
        triggerClassName="max-sm:pr-11"
      />
      <button
        type="button"
        onClick={swapEndpoints}
        className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-sky shadow-sm transition-colors hover:border-sky/30 hover:bg-sky/5 sm:hidden"
        aria-label={t("flights.form.swap")}
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
