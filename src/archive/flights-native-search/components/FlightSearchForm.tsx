"use client";

import { ArrowRightLeft, Minus, Plus, Search } from "lucide-react";
import AirportCombobox from "./AirportCombobox";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AviasalesPlace, FlightTripType } from "@/lib/travelpayouts/aviasales/types";
import type { LocaleCode } from "@/types/locale";

export type FlightSearchFormState = {
  origin: AviasalesPlace | null;
  destination: AviasalesPlace | null;
  departDate: string;
  returnDate: string;
  tripType: FlightTripType;
  adults: number;
  children: number;
  infants: number;
};

type FlightSearchFormProps = {
  state: FlightSearchFormState;
  onChange: (next: FlightSearchFormState) => void;
  onSubmit: () => void;
  loading?: boolean;
  locale: LocaleCode;
  labels: {
    origin: string;
    destination: string;
    originPlaceholder: string;
    destinationPlaceholder: string;
    departDate: string;
    returnDate: string;
    oneWay: string;
    roundTrip: string;
    adults: string;
    children: string;
    infants: string;
    search: string;
    searching: string;
    swap: string;
  };
};

function CounterField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2">
      <span className="text-sm text-charcoal">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-charcoal disabled:opacity-40"
          aria-label={`${label} minus`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          disabled={value >= 9}
          onClick={() => onChange(Math.min(9, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-charcoal disabled:opacity-40"
          aria-label={`${label} plus`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function FlightSearchForm({
  state,
  onChange,
  onSubmit,
  loading,
  locale,
  labels,
}: FlightSearchFormProps) {
  const minDate = new Date().toISOString().slice(0, 10);

  function swapEndpoints() {
    onChange({
      ...state,
      origin: state.destination,
      destination: state.origin,
    });
  }

  return (
    <form
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-elevated ring-1 ring-gray-100/80 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-wrap gap-2">
        {(["one_way", "round_trip"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ ...state, tripType: type })}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              state.tripType === type
                ? "bg-sky text-white"
                : "border border-gray-200 text-charcoal hover:border-sky/30"
            )}
          >
            {type === "one_way" ? labels.oneWay : labels.roundTrip}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
        <AirportCombobox
          label={labels.origin}
          placeholder={labels.originPlaceholder}
          value={state.origin}
          onChange={(origin) => onChange({ ...state, origin })}
          locale={locale}
          disabled={loading}
        />

        <button
          type="button"
          onClick={swapEndpoints}
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-sky hover:bg-sky/5 lg:mb-1"
          aria-label={labels.swap}
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>

        <AirportCombobox
          label={labels.destination}
          placeholder={labels.destinationPlaceholder}
          value={state.destination}
          onChange={(destination) => onChange({ ...state, destination })}
          locale={locale}
          disabled={loading}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-charcoal">{labels.departDate}</span>
          <input
            type="date"
            min={minDate}
            value={state.departDate}
            onChange={(event) => onChange({ ...state, departDate: event.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            required
          />
        </label>

        {state.tripType === "round_trip" ? (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-charcoal">{labels.returnDate}</span>
            <input
              type="date"
              min={state.departDate || minDate}
              value={state.returnDate}
              onChange={(event) => onChange({ ...state, returnDate: event.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              required
            />
          </label>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <CounterField
          label={labels.adults}
          value={state.adults}
          min={1}
          onChange={(adults) => onChange({ ...state, adults })}
        />
        <CounterField
          label={labels.children}
          value={state.children}
          min={0}
          onChange={(children) => onChange({ ...state, children })}
        />
        <CounterField
          label={labels.infants}
          value={state.infants}
          min={0}
          onChange={(infants) => onChange({ ...state, infants })}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !state.origin || !state.destination || !state.departDate}
        className={cn(
          buttonVariants({ variant: "default" }),
          "mt-6 w-full rounded-full py-6 text-base sm:w-auto sm:px-10"
        )}
      >
        <Search className="mr-2 h-5 w-5" />
        {loading ? labels.searching : labels.search}
      </button>
    </form>
  );
}
