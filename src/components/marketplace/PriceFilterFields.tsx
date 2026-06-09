"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { TourListing } from "@/types";
import {
  getFilterPriceMax,
  getSliderPriceBounds,
  getSliderPriceStep,
  snapPriceToStep,
} from "@/lib/currency";
import { clampPriceRange, getDefaultPriceRange, getTourPriceBounds } from "@/lib/tour-price-bounds";
import { cn } from "@/lib/cn";

interface PriceFilterFieldsProps {
  priceMin: number;
  priceMax: number;
  priceMinLimit: number;
  onChange: (patch: { priceMin: number; priceMax: number }) => void;
  className?: string;
  showCurrencyHeader?: boolean;
}

function PriceInput({
  label,
  value,
  symbol,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  symbol: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex-1">
      <label className="text-xs text-slate">{label}</label>
      <div className="relative mt-1">
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isFinite(next)) onChange(next);
          }}
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
  priceMinLimit,
  onChange,
  className,
  showCurrencyHeader = true,
}: PriceFilterFieldsProps) {
  const { currency, currencyInfo, locale } = useLocaleCurrency();
  const priceMaxLimit = getFilterPriceMax(currency);
  const sliderStep = getSliderPriceStep(priceMinLimit, priceMaxLimit);
  const { min: sliderMin, max: sliderMax } = getSliderPriceBounds(
    priceMinLimit,
    priceMaxLimit,
    sliderStep
  );
  const effectiveMax = priceMax || sliderMax;
  const currencyName = currencyInfo.name[locale];

  const sliderMinValue = snapPriceToStep(
    Math.max(priceMin, sliderMin),
    sliderMin,
    sliderStep
  );
  const sliderMaxValue = snapPriceToStep(
    Math.min(effectiveMax, sliderMax),
    sliderMin,
    sliderStep
  );

  function applyRange(nextMin: number, nextMax: number) {
    onChange(clampPriceRange(nextMin, nextMax, priceMinLimit, sliderMax));
  }

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
          min={priceMinLimit}
          max={effectiveMax}
          onChange={(min) => applyRange(min, effectiveMax)}
        />
        <PriceInput
          label="до"
          value={effectiveMax}
          symbol={currencyInfo.symbol}
          min={priceMin}
          max={sliderMax}
          onChange={(max) => applyRange(priceMin, max)}
        />
      </div>

      <Slider
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        minStepsBetweenThumbs={1}
        value={[sliderMinValue, Math.max(sliderMinValue + sliderStep, sliderMaxValue)]}
        onValueChange={([min, max]) => applyRange(min, max)}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function usePriceFilterLimits(tours: TourListing[] = []) {
  const { currency } = useLocaleCurrency();
  const { min } = getTourPriceBounds(tours, currency);
  const { priceMax } = getDefaultPriceRange(tours, currency);
  return {
    currency,
    priceMin: min,
    priceMax,
  };
}
