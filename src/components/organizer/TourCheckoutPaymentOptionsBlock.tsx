"use client";

import { BOOKING_CHECKOUT_PAYMENT_LABELS } from "@/types/booking-params";
import type { BookingCheckoutPaymentOption } from "@/types/booking-params";
import type { TourCheckoutPaymentOptions } from "@/types/tour-checkout-payment";
import {
  countEnabledTourCheckoutPaymentOptions,
  toggleTourCheckoutPaymentOption,
} from "@/types/tour-checkout-payment";
import { cn } from "@/lib/cn";

const OPTION_META: Array<{
  id: BookingCheckoutPaymentOption;
  title: string;
  description: string;
}> = [
  {
    id: "full",
    title: BOOKING_CHECKOUT_PAYMENT_LABELS.full,
    description: "Турист оплачивает полную стоимость тура при бронировании.",
  },
  {
    id: "deposit",
    title: "Депозит",
    description: "Частичная оплата при бронировании, остаток — позже по договорённости.",
  },
  {
    id: "later",
    title: BOOKING_CHECKOUT_PAYMENT_LABELS.later,
    description:
      "Заявка без списания средств. После подтверждения вы отправите туристу ссылку на оплату.",
  },
];

interface TourCheckoutPaymentOptionsBlockProps {
  options: TourCheckoutPaymentOptions;
  onChange: (options: TourCheckoutPaymentOptions) => void;
}

export default function TourCheckoutPaymentOptionsBlock({
  options,
  onChange,
}: TourCheckoutPaymentOptionsBlockProps) {
  function toggleOption(id: BookingCheckoutPaymentOption, enabled: boolean) {
    const result = toggleTourCheckoutPaymentOption(options, id, enabled);
    if ("error" in result) return;
    onChange(result);
  }

  const enabledCount = countEnabledTourCheckoutPaymentOptions(options);

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
          Способы оплаты при бронировании
        </h2>
        <p className="mt-1 text-sm text-slate">
          Выберите, какие варианты увидит турист на шаге оплаты. Должен быть включён хотя бы один.
        </p>
      </div>

      <div className="space-y-4">
        {OPTION_META.map(({ id, title, description }) => {
          const selected =
            id === "full"
              ? options.fullPaymentEnabled
              : id === "deposit"
                ? options.depositEnabled
                : options.payLaterEnabled;

          const depositTitle =
            id === "deposit" ? `Депозит ${options.depositPercent}%` : title;

          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                selected
                  ? "border-sky/40 bg-sky/[0.08] ring-1 ring-sky/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={(event) => toggleOption(id, event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-brand"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-charcoal">{depositTitle}</span>
                <span className="mt-1 block text-sm leading-relaxed text-slate">{description}</span>
              </span>
            </label>
          );
        })}
      </div>

      {options.depositEnabled ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-4">
          <label className="block text-sm font-medium text-charcoal" htmlFor="deposit-percent">
            Размер депозита, %
          </label>
          <input
            id="deposit-percent"
            type="number"
            min={1}
            max={100}
            value={options.depositPercent}
            onChange={(event) => {
              const value = Math.min(100, Math.max(1, Number(event.target.value) || 10));
              onChange({ ...options, depositPercent: value });
            }}
            className="mt-2 w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      ) : null}

      <p className="text-xs text-slate">
        Сейчас доступно вариантов: {enabledCount} из 3
      </p>
    </section>
  );
}
