"use client";

import { cn } from "@/lib/utils";
import { ESIM_COUNTRIES } from "@/data/esim-countries";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";

type EsimCountryPickerProps = {
  value: string;
  onChange: (countryId: string) => void;
  className?: string;
};

export default function EsimCountryPicker({ value, onChange, className }: EsimCountryPickerProps) {
  const { t } = useLocaleCurrency();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {ESIM_COUNTRIES.map((country) => {
        const active = country.id === value;
        return (
          <button
            key={country.id}
            type="button"
            onClick={() => onChange(country.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-sky bg-sky text-white"
                : "border-gray-200 bg-white text-charcoal hover:border-sky/40 hover:bg-sky/5"
            )}
          >
            {t(country.nameKey)}
          </button>
        );
      })}
    </div>
  );
}
