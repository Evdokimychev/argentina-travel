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
  const [loadFailed, setLoadFailed] = useState(false);
  const [options, setOptions] = useState<TransferLocation[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    setQuery(value ? formatTransferLocationLabel(value) : "");
  }, [value]);

  const fetchLocations = useCallback(
    async (term: string) => {
      const requestSequence = ++requestSequenceRef.current;
      setLoading(true);
      setLoadFailed(false);
      try {
        const params = new URLSearchParams({ term, locale });
        const response = await fetch(`/api/transfers/autocomplete?${params}`);
        const payload = (await response.json()) as { locations?: TransferLocation[] };
        if (requestSequence !== requestSequenceRef.current) return;
        const nextOptions = payload.locations ?? [];
        setOptions(nextOptions);
        setActiveIndex(nextOptions.length ? 0 : -1);
      } catch {
        if (requestSequence !== requestSequenceRef.current) return;
        setOptions([]);
        setActiveIndex(-1);
        setLoadFailed(true);
      } finally {
        if (requestSequence === requestSequenceRef.current) setLoading(false);
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
    setActiveIndex(-1);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setOptions([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (!options.length) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        if (current < 0) return direction > 0 ? 0 : options.length - 1;
        return (current + direction + options.length) % options.length;
      });
      return;
    }

    if (event.key === "Enter" && open && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault();
      handleSelect(options[activeIndex]);
    }
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
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value && event.target.value !== formatTransferLocationLabel(value)) {
              onChange(null);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn("pl-9", query || value ? "pr-9" : undefined)}
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate hover:bg-gray-100"
            aria-label="Очистить"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {loading
          ? "Ищем варианты"
          : loadFailed
            ? "Не удалось загрузить варианты"
            : open && query && options.length === 0
              ? "Совпадений не найдено"
              : open && options.length
                ? `Найдено вариантов: ${options.length}`
                : ""}
      </div>

      {open && (options.length > 0 || (!loading && query)) ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {loadFailed ? (
            <li className="px-4 py-3 text-sm text-error">
              Не удалось загрузить варианты. Продолжите ввод или повторите позже.
            </li>
          ) : options.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">
              Ничего не найдено. Попробуйте название города, аэропорта или вокзала.
            </li>
          ) : options.map((location, index) => (
            <li
                key={location.id}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={value?.id === location.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2 px-3 py-2.5 text-left text-sm",
                  index === activeIndex ? "bg-sky/10" : "hover:bg-sky/5",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(location)}
              >
                <span className="font-medium text-charcoal">{location.name}</span>
                <span className="text-slate">
                  {location.countryName ? `${location.countryName} · ` : ""}
                  {location.code ?? (location.type === "point" ? "точка" : "")}
                </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
