"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  formatPhoneDisplay,
  getPhoneCountry,
  parsePhoneInput,
  splitInternationalPhone,
} from "@/lib/phone-countries";

interface PhoneCountryInputProps {
  value: string;
  onChange: (internationalPhone: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export default function PhoneCountryInput({
  value,
  onChange,
  id,
  placeholder = "+7 999 922 65 64",
  className,
}: PhoneCountryInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [countryIso, setCountryIso] = useState(DEFAULT_PHONE_COUNTRY.iso);
  const [displayValue, setDisplayValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const country = getPhoneCountry(countryIso);

  useEffect(() => {
    if (isFocused) return;

    if (!value) {
      setCountryIso(DEFAULT_PHONE_COUNTRY.iso);
      setDisplayValue("");
      return;
    }

    const parsed = splitInternationalPhone(value);
    setCountryIso(parsed.country.iso);
    setDisplayValue(formatPhoneDisplay(parsed.country, parsed.nationalDigits));
  }, [value, isFocused]);

  useEffect(() => {
    if (!dropdownOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [dropdownOpen]);

  function applyParsedInput(raw: string, fallbackCountry = country) {
    const parsed = parsePhoneInput(raw, fallbackCountry);
    setCountryIso(parsed.country.iso);
    setDisplayValue(parsed.display);
    onChange(parsed.international);
    return parsed;
  }

  function handleInputChange(raw: string) {
    let next = raw;

    if (!next.startsWith("+")) {
      next = next ? `+${next.replace(/\D/g, "")}` : "+";
    }

    applyParsedInput(next);
  }

  function handleFocus() {
    setIsFocused(true);

    if (!displayValue) {
      const nextDisplay = `+${country.dialCode} `;
      setDisplayValue(nextDisplay);
      return;
    }

    if (!displayValue.startsWith("+")) {
      setDisplayValue(`+${displayValue.replace(/\D/g, "")}`);
    }
  }

  function handleBlur() {
    setIsFocused(false);

    if (!value) {
      setDisplayValue("");
      return;
    }

    const parsed = splitInternationalPhone(value);
    setDisplayValue(formatPhoneDisplay(parsed.country, parsed.nationalDigits));
  }

  function handleCountrySelect(iso: string) {
    const nextCountry = getPhoneCountry(iso);
    setDropdownOpen(false);

    const current = splitInternationalPhone(value || displayValue);
    const nationalDigits = current.nationalDigits.slice(0, nextCountry.nationalLength);
    const nextDisplay = formatPhoneDisplay(nextCountry, nationalDigits);

    setCountryIso(iso);
    setDisplayValue(nextDisplay);
    onChange(nationalDigits ? `+${nextCountry.dialCode}${nationalDigits}` : "");

    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex overflow-hidden rounded-xl border bg-gray-50 transition-[border-color,box-shadow]",
          "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
          dropdownOpen ? "border-brand ring-2 ring-brand/20" : "border-gray-200"
        )}
      >
        <button
          type="button"
          onClick={() => {
            setDropdownOpen((open) => !open);
            inputRef.current?.focus();
          }}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          className="flex shrink-0 items-center gap-1 border-r border-gray-200 px-3 py-3 text-sm text-charcoal transition-colors hover:bg-gray-100/80"
        >
          <span aria-hidden>{country.flag}</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 text-slate transition-transform", dropdownOpen && "rotate-180")}
            aria-hidden
          />
        </button>

        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder}
          value={displayValue}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-charcoal outline-none placeholder:text-gray-400"
        />
      </div>

      {dropdownOpen ? (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+0.35rem)] z-10 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {PHONE_COUNTRIES.map((option) => {
            const selected = option.iso === countryIso;
            return (
              <li key={option.iso}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleCountrySelect(option.iso)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50",
                    selected && "bg-gray-50 font-medium text-charcoal"
                  )}
                >
                  <span aria-hidden>{option.flag}</span>
                  <span className="min-w-0 flex-1 truncate text-charcoal">{option.name}</span>
                  <span className="shrink-0 text-slate">+{option.dialCode}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
