"use client";

import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/switch";
import { getCurrency } from "@/data/locale-config";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/types/locale";

interface TourIndividualBlockProps {
  enabled: boolean;
  periodFrom: string;
  periodTo: string;
  priceUsd: number;
  currency: CurrencyCode;
  onEnabledChange: (enabled: boolean) => void;
  onPeriodFromChange: (value: string) => void;
  onPeriodToChange: (value: string) => void;
  onPriceChange: (value: number) => void;
}

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-charcoal">
        {children}
      </label>
      {hint ? <p className="mt-0.5 text-xs leading-relaxed text-slate">{hint}</p> : null}
    </div>
  );
}

export default function TourIndividualBlock({
  enabled,
  periodFrom,
  periodTo,
  priceUsd,
  currency,
  onEnabledChange,
  onPeriodFromChange,
  onPeriodToChange,
  onPriceChange,
}: TourIndividualBlockProps) {
  const currencyInfo = getCurrency(currency);

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">Индивидуальный тур</h2>

      <SwitchRow
        checked={enabled}
        onCheckedChange={onEnabledChange}
        label="Тур может проводиться индивидуально"
        labelAddon={<Info className="h-4 w-4 shrink-0 text-sky" aria-hidden />}
      />

      {enabled ? (
        <div className="space-y-4 border-t border-gray-200/80 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="individual-period-from"
                hint='Указывается в формате «день.месяц», например, 01.02'
              >
                Начало периода
              </FieldLabel>
              <Input
                id="individual-period-from"
                value={periodFrom}
                onChange={(event) => onPeriodFromChange(event.target.value)}
                placeholder="01.01"
              />
            </div>
            <div>
              <FieldLabel
                htmlFor="individual-period-to"
                hint='Указывается в формате «день.месяц», например, 12.10'
              >
                Конец периода
              </FieldLabel>
              <Input
                id="individual-period-to"
                value={periodTo}
                onChange={(event) => onPeriodToChange(event.target.value)}
                placeholder="31.12"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="individual-price">Стоимость тура за одного туриста</FieldLabel>
            <div className="relative">
              <Input
                id="individual-price"
                type="number"
                min={0}
                value={priceUsd || ""}
                onChange={(event) => onPriceChange(Number(event.target.value) || 0)}
                className="pr-16"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate">
                {currency === "USD" ? "US$" : `${currencyInfo.symbol} ${currency}`}
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate">
            Данная стоимость будет указана для варианта проведения тура под запрос. Если в туре есть
            фиксированные даты заездов — тогда стоимость тура указывается для каждого заезда.
          </p>
        </div>
      ) : null}
    </section>
  );
}
