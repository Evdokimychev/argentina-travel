"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { TourListing } from "@/types";
import {
  formatFilterAmount,
  getFilterPriceMax,
  getSliderPriceBounds,
  getSliderPriceStep,
  parseFilterAmount,
  snapPriceToStep,
} from "@/lib/currency";
import { clampPriceRange, getDefaultPriceRange, getTourPriceBounds, resolvePriceFilterSliderTrackMax } from "@/lib/tour-price-bounds";
import { cn } from "@/lib/cn";

interface PriceFilterFieldsProps {
  priceMin: number;
  priceMax: number;
  priceMinLimit: number;
  /** Upper bound for slider (catalog max or filter cap). */
  sliderCeiling?: number;
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
  const { locale } = useLocaleCurrency();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatFilterAmount(value, locale));

  useEffect(() => {
    if (!focused) {
      setDraft(formatFilterAmount(value, locale));
    }
  }, [focused, locale, value]);

  function commitDraft(raw: string) {
    const parsed = parseFilterAmount(raw);
    if (parsed == null) {
      setDraft(formatFilterAmount(value, locale));
      return;
    }
    onChange(Math.max(min, Math.min(max, parsed)));
  }

  return (
    <div className="flex-1">
      <label className="text-xs text-slate">{label}</label>
      <div className="relative mt-1">
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={focused ? draft : formatFilterAmount(value, locale)}
          onFocus={() => {
            setFocused(true);
            setDraft(formatFilterAmount(value, locale));
          }}
          onBlur={() => {
            setFocused(false);
            commitDraft(draft);
          }}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            const parsed = parseFilterAmount(next);
            if (parsed != null) {
              onChange(Math.max(min, Math.min(max, parsed)));
            }
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
  sliderCeiling,
  onChange,
  className,
  showCurrencyHeader = true,
}: PriceFilterFieldsProps) {
  const { currency, currencyInfo, locale } = useLocaleCurrency();
  const filterCap = getFilterPriceMax(currency);
  const ceiling = sliderCeiling ?? filterCap;
  const sliderStep = getSliderPriceStep(priceMinLimit, ceiling);
  const { min: sliderMin, max: fullSliderMax } = getSliderPriceBounds(
    priceMinLimit,
    ceiling,
    sliderStep
  );
  const effectiveMax = priceMax || fullSliderMax;
  const sliderTrackMax = resolvePriceFilterSliderTrackMax({
    priceMin,
    priceMax,
    catalogMin: priceMinLimit,
    fullSliderMax,
    filterCap,
  });
  const { max: sliderMax } = getSliderPriceBounds(priceMinLimit, sliderTrackMax, sliderStep);
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
    onChange(clampPriceRange(nextMin, nextMax, priceMinLimit, fullSliderMax));
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
          max={fullSliderMax}
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
  const { min, max: catalogMax } = getTourPriceBounds(tours, currency);
  const filterCap = getFilterPriceMax(currency);
  const { priceMax } = getDefaultPriceRange(tours, currency);
  return {
    currency,
    priceMin: min,
    priceMax,
    sliderCeiling: Math.max(catalogMax, filterCap),
  };
}
