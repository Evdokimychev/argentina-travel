"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { formatTransferLocationLabel } from "@/data/transfer-locations";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TransferLocation } from "@/lib/intui/types";
import type { LocaleCode } from "@/types/locale";

type TransferLocationComboboxProps = {
  id?: string;
  label: string;
  placeholder: string;
  value: TransferLocation | null;
  onChange: (location: TransferLocation | null) => void;
  locale: LocaleCode;
  disabled?: boolean;
};

export default function TransferLocationCombobox({
  id,
  label,
  placeholder,
  value,
  onChange,
  locale,
  disabled,
}: TransferLocationComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value ? formatTransferLocationLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<TransferLocation[]>([]);

  useEffect(() => {
    setQuery(value ? formatTransferLocationLabel(value) : "");
  }, [value]);

  const fetchLocations = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ term, locale });
        const response = await fetch(`/api/transfers/autocomplete?${params}`);
        const payload = (await response.json()) as { locations?: TransferLocation[] };
        setOptions(payload.locations ?? []);
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
      void fetchLocations(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, open, fetchLocations]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleSelect(location: TransferLocation) {
    onChange(location);
    setQuery(formatTransferLocationLabel(location));
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
            if (value && event.target.value !== formatTransferLocationLabel(value)) {
              onChange(null);
            }
          }}
          className={cn("pl-9", query || value ? "pr-9" : undefined)}
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
          {options.map((location) => (
            <li key={location.id}>
              <button
                type="button"
                role="option"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-sky/5"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(location)}
              >
                <span className="font-medium text-charcoal">{location.name}</span>
                <span className="text-slate">
                  {location.countryName ? `${location.countryName} · ` : ""}
                  {location.code ?? (location.type === "point" ? "точка" : "")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
