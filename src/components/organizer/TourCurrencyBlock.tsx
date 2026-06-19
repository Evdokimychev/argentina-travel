"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SwitchField } from "@/components/ui/switch";
import { CURRENCIES } from "@/data/locale-config";
import type { CurrencyCode } from "@/types/locale";

interface TourCurrencyBlockProps {
  currency: CurrencyCode;
  priceFromPrefix: boolean;
  priceOnRequest: boolean;
  referencePriceUsd: number;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onPriceFromPrefixChange: (enabled: boolean) => void;
  onPriceOnRequestChange: (enabled: boolean) => void;
  onReferencePriceChange: (value: number) => void;
}

export default function TourCurrencyBlock({
  currency,
  priceFromPrefix,
  priceOnRequest,
  referencePriceUsd,
  onCurrencyChange,
  onPriceFromPrefixChange,
  onPriceOnRequestChange,
  onReferencePriceChange,
}: TourCurrencyBlockProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Стоимость тура</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate">
          Для индивидуальных маршрутов, люкс-туров и групповых поездок с персональным расчётом можно
          скрыть фиксированную цену и принимать запросы.
        </p>
      </div>

      <div className="rounded-2xl border border-violet-200/80 bg-violet-50/70 p-4">
        <SwitchField
          checked={priceOnRequest}
          onCheckedChange={onPriceOnRequestChange}
          label="Цена по запросу"
          description="Вместо бронирования с оплатой туристы отправят заявку на расчёт стоимости. Подходит для экскурсий и туров на платформе — не для партнёрских экскурсий Tripster и Sputnik8."
        />
      </div>

      <div className="relative">
        <label
          htmlFor="tour-price-currency"
          className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium text-slate"
        >
          Валюта
        </label>
        <NativeSelect
          id="tour-price-currency"
          value={currency}
          onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
          className="h-14 pt-1"
        >
          {CURRENCIES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name.ru}, {option.code}
            </option>
          ))}
        </NativeSelect>
      </div>

      {priceOnRequest ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
          <div>
            <label htmlFor="tour-reference-price" className="mb-1.5 block text-xs font-medium text-charcoal">
              Ориентировочная цена, $<span className="text-brand">*</span>
            </label>
            <Input
              id="tour-reference-price"
              type="number"
              min={1}
              required
              value={referencePriceUsd || ""}
              placeholder="Например, 1200"
              onChange={(event) =>
                onReferencePriceChange(Math.max(0, Number(event.target.value) || 0))
              }
            />
            <p className="mt-1.5 text-xs leading-relaxed text-slate">
              Нужна для фильтров каталога по стоимости. На сайте туристам не показывается — только
              подпись «Цена по запросу».
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300">
          <SwitchField
            checked={priceFromPrefix}
            onCheckedChange={onPriceFromPrefixChange}
            label="Выводить стоимость с приставкой «от»"
            description="При активации рекомендуем указывать варианты цен в описании проживания."
          />
          <p className="mt-3 text-xs leading-relaxed text-slate">
            Базовая цена задаётся в индивидуальном блоке или в датах группового тура. Для
            фиксированного прайса укажите её там и отключите «Цена по запросу».
          </p>
        </div>
      )}
    </section>
  );
}
