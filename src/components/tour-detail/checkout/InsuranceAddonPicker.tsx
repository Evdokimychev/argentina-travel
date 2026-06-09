"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";
import { formatTourists } from "@/lib/pluralize";
import { calcInsuranceTotal, INSURANCE_ADDON } from "./checkout-addons";

interface InsuranceAddonPickerProps {
  guests: number;
  count: number;
  onChange: (count: number) => void;
}

export default function InsuranceAddonPicker({
  guests,
  count,
  onChange,
}: InsuranceAddonPickerProps) {
  const enabled = count > 0;
  const isFullGroup = count === guests;
  const [expanded, setExpanded] = useState(false);
  const lineTotal = calcInsuranceTotal(count);

  useEffect(() => {
    if (enabled && !isFullGroup) setExpanded(true);
  }, [enabled, isFullGroup]);

  function handleToggle(checked: boolean) {
    if (checked) {
      onChange(guests);
      setExpanded(false);
    } else {
      onChange(0);
      setExpanded(false);
    }
  }

  return (
    <li>
      <div className="rounded-xl border border-gray-200 bg-white transition-all">
        <label className="flex cursor-pointer gap-3 p-4">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="mt-1 h-4 w-4 accent-brand"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="font-medium text-charcoal">{INSURANCE_ADDON.title}</span>
              <span className="shrink-0 text-right text-sm font-semibold text-charcoal">
                <FormattedPrice
                  priceUsd={INSURANCE_ADDON.priceUsdPerTraveler}
                  className="text-sm font-semibold"
                />
                <span className="block text-[11px] font-normal text-slate">за туриста</span>
              </span>
            </span>
            <span className="mt-1 block text-sm text-slate">{INSURANCE_ADDON.description}</span>
          </span>
        </label>

        {enabled && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3">
            {!expanded ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-charcoal">
                  <span className="font-medium">{formatTourists(count)}</span>
                  <span className="text-slate"> · </span>
                  <FormattedPrice priceUsd={lineTotal} className="text-sm font-medium text-charcoal" />
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-brand hover:bg-white hover:text-brand"
                >
                  Изменить количество
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="insurance-travelers"
                      className="text-xs font-medium text-charcoal"
                    >
                      Для скольких туристов оформить страховку
                    </label>
                    <div className="relative mt-1.5 sm:max-w-[220px]">
                      <select
                        id="insurance-travelers"
                        value={count}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-full appearance-none rounded-xl border border-brand bg-white px-3 py-2.5 pr-9 text-sm font-medium text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      >
                        {Array.from({ length: guests }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {formatTourists(n)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-slate">Итого</p>
                    <FormattedPrice priceUsd={lineTotal} className="text-sm font-semibold text-charcoal" />
                  </div>
                </div>

                {isFullGroup && (
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="text-xs font-medium text-slate transition-colors hover:text-charcoal"
                  >
                    ← Страховка на всю группу
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
