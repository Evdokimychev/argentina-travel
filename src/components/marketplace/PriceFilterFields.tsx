"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { getFilterPriceMax, getFilterPriceStep } from "@/lib/currency";
import { cn } from "@/lib/cn";

interface PriceFilterFieldsProps {
  priceMin: number;
  priceMax: number;
  onChange: (patch: { priceMin: number; priceMax: number }) => void;
  className?: string;
  showCurrencyHeader?: boolean;
}

function PriceInput({
  label,
  value,
  symbol,
  onChange,
}: {
  label: string;
  value: number;
  symbol: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex-1">
      <label className="text-xs text-slate">{label}</label>
      <div className="relative mt-1">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="h-9 pr-10 tabular-nums"
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate"
          aria-hidden
        >
          {symbol}
        </span>
      </div>
    </div>
  );
}

export default function PriceFilterFields({
  priceMin,
  priceMax,
  onChange,
  className,
  showCurrencyHeader = true,
}: PriceFilterFieldsProps) {
  const { currency, currencyInfo, locale } = useLocaleCurrency();
  const priceMaxLimit = getFilterPriceMax(currency);
  const priceStep = getFilterPriceStep(currency);
  const effectiveMax = priceMax || priceMaxLimit;
  const currencyName = currencyInfo.name[locale];

  return (
    <div className={cn("space-y-4", className)}>
      {showCurrencyHeader && (
        <p className="text-xs text-slate">
          Цены в{" "}
          <span className="font-semibold text-charcoal">
            {currencyName} ({currency})
          </span>
        </p>
      )}

      <div className="flex gap-3">
        <PriceInput
          label="от"
          value={priceMin}
          symbol={currencyInfo.symbol}
          onChange={(priceMin) => onChange({ priceMin, priceMax: effectiveMax })}
        />
        <PriceInput
          label="до"
          value={effectiveMax}
          symbol={currencyInfo.symbol}
          onChange={(priceMax) => onChange({ priceMin, priceMax })}
        />
      </div>

      <Slider
        min={0}
        max={priceMaxLimit}
        step={priceStep}
        value={[priceMin, effectiveMax]}
        onValueChange={([min, max]) => onChange({ priceMin: min, priceMax: max })}
      />
    </div>
  );
}

export function usePriceFilterLimits() {
  const { currency } = useLocaleCurrency();
  return {
    currency,
    priceMax: getFilterPriceMax(currency),
  };
}
