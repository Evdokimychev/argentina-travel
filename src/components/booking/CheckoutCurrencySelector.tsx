"use client";

import { cn } from "@/lib/cn";
import {
  CHECKOUT_CURRENCY_OPTIONS,
  type CheckoutCurrencyCode,
} from "@/lib/payments/checkout-currency";

interface CheckoutCurrencySelectorProps {
  value: CheckoutCurrencyCode;
  onChange: (currency: CheckoutCurrencyCode) => void;
  className?: string;
  id?: string;
}

export default function CheckoutCurrencySelector({
  value,
  onChange,
  className,
  id = "checkout-currency",
}: CheckoutCurrencySelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-charcoal" id={`${id}-label`}>
        Валюта отображения
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="flex rounded-xl bg-gray-100 p-1"
      >
        {CHECKOUT_CURRENCY_OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={value === option.code}
            onClick={() => onChange(option.code)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              value === option.code
                ? "bg-white text-charcoal shadow-sm"
                : "text-slate hover:text-charcoal"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
