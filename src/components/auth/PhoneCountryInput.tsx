"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  buildInternationalPhone,
  formatNationalDigits,
  getPhoneCountry,
  parseInternationalPhone,
  resolveCountryFromDialCode,
  splitInternationalPhone,
  type PhoneCountry,
} from "@/lib/phone-countries";

interface PhoneCountryInputProps {
  value: string;
  onChange: (internationalPhone: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

function syncFromInternational(international: string) {
  if (!international) {
    return {
      countryIso: DEFAULT_PHONE_COUNTRY.iso,
      nationalDigits: "",
    };
  }

  const parsed = splitInternationalPhone(international);
  return {
    countryIso: parsed.country.iso,
    nationalDigits: parsed.nationalDigits,
  };
}

function normalizeNationalRaw(raw: string, country: PhoneCountry) {
  const trimmed = raw.trim();

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    const international = trimmed.startsWith("00")
      ? `+${trimmed.slice(2).replace(/\D/g, "")}`
      : trimmed;
    const parsed = parseInternationalPhone(international);
    if (parsed?.nationalDigits) {
      return {
        country: parsed.country,
        nationalDigits: parsed.nationalDigits.slice(0, parsed.country.nationalLength),
      };
    }
  }

  let digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith(country.dialCode) && digits.length > country.nationalLength) {
    const withoutDial = digits.slice(country.dialCode.length);
    if (withoutDial.length <= country.nationalLength) {
      digits = withoutDial;
    }
  }

  if (digits.length > country.nationalLength) {
    const parsed = parseInternationalPhone(`+${digits}`);
    if (parsed?.nationalDigits) {
      return {
        country: parsed.country,
        nationalDigits: parsed.nationalDigits.slice(0, parsed.country.nationalLength),
      };
    }
  }

  return {
    country,
    nationalDigits: digits.slice(0, country.nationalLength),
  };
}

function clampDialSelection(input: HTMLInputElement) {
  const min = 1;
  const start = input.selectionStart ?? min;
  const end = input.selectionEnd ?? min;

  if (start >= min && end >= min) return;

  const nextStart = start < min ? min : start;
  const nextEnd = end < min ? min : end;
  input.setSelectionRange(nextStart, nextEnd);
}

/** Код страны однозначно определён — можно закрепить без Enter. */
function isDialCodeComplete(digits: string, currentIso: string): boolean {
  if (!digits) return false;

  const exactMatches = PHONE_COUNTRIES.filter((country) => country.dialCode === digits);
  if (exactMatches.length >= 1) return true;

  const canExtend = PHONE_COUNTRIES.some(
    (country) => country.dialCode.startsWith(digits) && country.dialCode.length > digits.length
  );
  if (canExtend) return false;

  return resolveCountryFromDialCode(digits, currentIso) !== null;
}

export default function PhoneCountryInput({
  value,
  onChange,
  id,
  placeholder = "999 922 65 64",
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: PhoneCountryInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const nationalInputRef = useRef<HTMLInputElement>(null);
  const dialInputRef = useRef<HTMLInputElement>(null);

  const [countryIso, setCountryIso] = useState(DEFAULT_PHONE_COUNTRY.iso);
  const [nationalDigits, setNationalDigits] = useState("");
  const [dialEditMode, setDialEditMode] = useState(false);
  const [dialEditDisplay, setDialEditDisplay] = useState("+");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const country = getPhoneCountry(countryIso);
  const nationalDisplay = formatNationalDigits(nationalDigits, country);
  const prefixLabel = `+${country.dialCode}`;

  useEffect(() => {
    if (isFocused || dialEditMode) return;
    const synced = syncFromInternational(value);
    setCountryIso(synced.countryIso);
    setNationalDigits(synced.nationalDigits);
  }, [value, isFocused, dialEditMode]);

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

  const emitChange = useCallback(
    (nextCountry: PhoneCountry, nextNationalDigits: string) => {
      const trimmed = nextNationalDigits.replace(/\D/g, "").slice(0, nextCountry.nationalLength);
      setCountryIso(nextCountry.iso);
      setNationalDigits(trimmed);
      onChange(trimmed ? buildInternationalPhone(nextCountry, trimmed) : "");
    },
    [onChange]
  );

  useLayoutEffect(() => {
    if (!dialEditMode || !dialInputRef.current) return;
    dialInputRef.current.focus();
    clampDialSelection(dialInputRef.current);
    const end = dialInputRef.current.value.length;
    if ((dialInputRef.current.selectionStart ?? 0) < 1) {
      dialInputRef.current.setSelectionRange(end, end);
    }
  }, [dialEditMode, dialEditDisplay]);

  function openDialEdit(initialDialCode = country.dialCode) {
    setDialEditMode(true);
    setDialEditDisplay(`+${initialDialCode}`);
    setDropdownOpen(false);
  }

  function finishDialEdit() {
    const digits = dialEditDisplay.replace(/\D/g, "");
    const resolved =
      resolveCountryFromDialCode(digits, countryIso) ??
      PHONE_COUNTRIES.find((option) => option.dialCode === digits) ??
      country;

    setCountryIso(resolved.iso);
    setDialEditMode(false);
  }

  function applyDialEdit(raw: string) {
    let next = raw;
    if (!next.startsWith("+")) {
      next = `+${next.replace(/\D/g, "")}`;
    }
    if (next === "") next = "+";

    setDialEditDisplay(next);

    const digits = next.replace(/\D/g, "");
    if (!digits) {
      setCountryIso(DEFAULT_PHONE_COUNTRY.iso);
      return;
    }

    const resolved =
      resolveCountryFromDialCode(digits, countryIso) ??
      PHONE_COUNTRIES.find((option) => digits.startsWith(option.dialCode));

    if (resolved) {
      setCountryIso(resolved.iso);
      const nextNational = nationalDigits.slice(0, resolved.nationalLength);
      setNationalDigits(nextNational);
      onChange(nextNational ? buildInternationalPhone(resolved, nextNational) : "");

      if (isDialCodeComplete(digits, countryIso)) {
        setDialEditMode(false);
      }
    }
  }

  function handleNationalChange(raw: string) {
    const normalized = normalizeNationalRaw(raw, country);
    emitChange(normalized.country, normalized.nationalDigits);
  }

  function handleNationalPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;

    if (/[+\d]/.test(pasted) && (pasted.includes("+") || pasted.replace(/\D/g, "").length > country.nationalLength)) {
      event.preventDefault();
      const normalized = normalizeNationalRaw(pasted, country);
      emitChange(normalized.country, normalized.nationalDigits);
    }
  }

  function handleNationalFocus() {
    if (dialEditMode) finishDialEdit();
    setIsFocused(true);
  }

  function handleNationalBlur() {
    setIsFocused(false);
    if (!value) {
      setNationalDigits("");
    }
  }

  function handleNationalKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Home") {
      event.preventDefault();
      nationalInputRef.current?.setSelectionRange(0, 0);
      return;
    }

    if (event.key !== "Backspace") return;

    const input = event.currentTarget;
    const caret = input.selectionStart ?? 0;
    const hasSelection = (input.selectionEnd ?? 0) > caret;

    if (!hasSelection && caret === 0 && nationalDigits.length === 0) {
      event.preventDefault();
      openDialEdit(country.dialCode);
    }
  }

  function handleDialPointerDown(event: React.MouseEvent<HTMLInputElement>) {
    requestAnimationFrame(() => {
      if (dialInputRef.current) clampDialSelection(dialInputRef.current);
    });
    event.stopPropagation();
  }

  function handleDialKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;

    if (event.key === "Home") {
      event.preventDefault();
      input.setSelectionRange(1, 1);
      return;
    }

    if (event.key === "ArrowLeft" && (input.selectionStart ?? 0) <= 1) {
      event.preventDefault();
      return;
    }

    if (event.key === "Tab") {
      finishDialEdit();
      return;
    }

    if (event.key === "Backspace") {
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      if (end <= 1) {
        event.preventDefault();
        setDialEditDisplay("+");
        setCountryIso(DEFAULT_PHONE_COUNTRY.iso);
      }
    }
  }

  function handleCountrySelect(iso: string) {
    const nextCountry = getPhoneCountry(iso);
    setDropdownOpen(false);
    setDialEditMode(false);

    const trimmedNational = nationalDigits.slice(0, nextCountry.nationalLength);
    emitChange(nextCountry, trimmedNational);
    requestAnimationFrame(() => nationalInputRef.current?.focus());
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
            if (dialEditMode) finishDialEdit();
            setDropdownOpen((open) => !open);
            nationalInputRef.current?.focus();
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

        <div className="flex min-w-0 flex-1 items-center gap-1 px-3 py-3">
          {dialEditMode ? (
            <input
              ref={dialInputRef}
              type="text"
              inputMode="tel"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Код страны"
              value={dialEditDisplay}
              onChange={(event) => applyDialEdit(event.target.value)}
              onBlur={finishDialEdit}
              onKeyDown={handleDialKeyDown}
              onFocus={() => setIsFocused(true)}
              onMouseDown={handleDialPointerDown}
              onClick={() => dialInputRef.current && clampDialSelection(dialInputRef.current)}
              onSelect={() => dialInputRef.current && clampDialSelection(dialInputRef.current)}
              className="w-[3.5rem] shrink-0 bg-transparent text-sm tabular-nums text-charcoal outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => openDialEdit(country.dialCode)}
              className="shrink-0 select-none rounded-sm text-sm tabular-nums text-charcoal transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              aria-label={`Код страны ${prefixLabel}. Нажмите, чтобы изменить`}
              title="Изменить код страны"
            >
              {prefixLabel}
            </button>
          )}

          <input
            ref={nationalInputRef}
            id={id}
            type="text"
            inputMode="tel"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            name="phone-national"
            placeholder={placeholder}
            value={nationalDisplay}
            onChange={(event) => handleNationalChange(event.target.value)}
            onPaste={handleNationalPaste}
            onFocus={handleNationalFocus}
            onBlur={handleNationalBlur}
            onKeyDown={handleNationalKeyDown}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-required={ariaRequired}
            className="min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none placeholder:text-slate/70"
          />
        </div>
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
                  onMouseDown={(event) => event.preventDefault()}
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
