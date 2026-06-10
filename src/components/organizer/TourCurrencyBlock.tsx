"use client";

import { SwitchField } from "@/components/ui/switch";
import { CURRENCIES } from "@/data/locale-config";
import type { CurrencyCode } from "@/types/locale";

interface TourCurrencyBlockProps {
  currency: CurrencyCode;
  priceFromPrefix: boolean;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onPriceFromPrefixChange: (enabled: boolean) => void;
}

export default function TourCurrencyBlock({
  currency,
  priceFromPrefix,
  onCurrencyChange,
  onPriceFromPrefixChange,
}: TourCurrencyBlockProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">Валюта тура</h2>

      <div className="relative">
        <label
          htmlFor="tour-price-currency"
          className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium text-slate"
        >
          Валюта
        </label>
        <select
          id="tour-price-currency"
          value={currency}
          onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
          className="flex h-14 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pt-1 text-sm text-charcoal focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
        >
          {CURRENCIES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name.ru}, {option.code}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate"
          aria-hidden
        >
          ▾
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300">
        <SwitchField
          checked={priceFromPrefix}
          onCheckedChange={onPriceFromPrefixChange}
          label="Выводить стоимость с приставкой «от»"
          description="При активации рекомендуем указывать варианты цен в общем описании проживания"
        />
      </div>
    </section>
  );
}
