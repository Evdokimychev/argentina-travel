"use client";

import { Globe } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CURRENCIES, POPULAR_CURRENCIES } from "@/data/locale-config";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { convertFromUsd, formatCurrencyAmount } from "@/lib/currency";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/types/locale";

function sortCurrencies(active: CurrencyCode): CurrencyCode[] {
  const popular = POPULAR_CURRENCIES.filter((code) => code !== active);
  const rest = CURRENCIES.map((c) => c.code).filter(
    (code) => code !== active && !POPULAR_CURRENCIES.includes(code as (typeof POPULAR_CURRENCIES)[number])
  );
  return [active, ...popular, ...rest];
}

interface PriceOtherCurrenciesPopoverProps {
  priceUsd: number;
  className?: string;
}

export default function PriceOtherCurrenciesPopover({
  priceUsd,
  className,
}: PriceOtherCurrenciesPopoverProps) {
  const { currency, locale, language } = useLocaleCurrency();
  const ordered = sortCurrencies(currency);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex max-w-full items-baseline gap-1.5 rounded-md text-left",
            "border-b border-dotted border-transparent transition-colors",
            "hover:border-sky/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          )}
          aria-label="Показать цену в других валютах"
        >
          <FormattedPrice priceUsd={priceUsd} className={className} />
          <Globe
            className="mb-0.5 h-3.5 w-3.5 shrink-0 text-slate/50 transition-colors group-hover:text-sky"
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[220px] max-w-[280px] p-3">
        <p className="text-xs font-semibold text-charcoal">Цена в других валютах</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate">
          Ориентировочно по тестовому курсу
        </p>
        <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">
          {ordered.map((code) => {
            const option = CURRENCIES.find((c) => c.code === code)!;
            const amount = convertFromUsd(priceUsd, code);
            const isActive = code === currency;

            return (
              <li
                key={code}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm",
                  isActive ? "bg-sky/10 font-medium text-sky" : "text-charcoal"
                )}
              >
                <span className="truncate text-xs text-slate">
                  {option.name[language.code] ?? option.code}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatCurrencyAmount(amount, code, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
