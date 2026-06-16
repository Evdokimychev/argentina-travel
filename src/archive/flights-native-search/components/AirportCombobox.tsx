"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AviasalesPlace } from "@/lib/travelpayouts/aviasales/types";
import { formatPlaceLabel } from "@/lib/travelpayouts/aviasales/autocomplete";
import type { LocaleCode } from "@/types/locale";

type AirportComboboxProps = {
  id?: string;
  label: string;
  placeholder: string;
  value: AviasalesPlace | null;
  onChange: (place: AviasalesPlace | null) => void;
  locale: LocaleCode;
  disabled?: boolean;
};

export default function AirportCombobox({
  id,
  label,
  placeholder,
  value,
  onChange,
  locale,
  disabled,
}: AirportComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value ? formatPlaceLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AviasalesPlace[]>([]);

  useEffect(() => {
    setQuery(value ? formatPlaceLabel(value) : "");
  }, [value]);

  const fetchPlaces = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ term, locale });
        const response = await fetch(`/api/flights/autocomplete?${params}`);
        const payload = (await response.json()) as { places?: AviasalesPlace[] };
        setOptions(payload.places ?? []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void fetchPlaces(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, open, fetchPlaces]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleSelect(place: AviasalesPlace) {
    onChange(place);
    setQuery(formatPlaceLabel(place));
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setOptions([]);
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-charcoal">
        {label}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
        <Input
          id={id}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value && event.target.value !== formatPlaceLabel(value)) {
              onChange(null);
            }
          }}
          className={cn("pl-9", (query || value) ? "pr-9" : undefined)}
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate hover:bg-gray-100"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && options.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((place) => (
            <li key={place.code}>
              <button
                type="button"
                role="option"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-sky/5"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(place)}
              >
                <span className="font-medium text-charcoal">{place.name}</span>
                <span className="text-slate">
                  {place.countryName ? `${place.countryName} · ` : ""}
                  {place.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
