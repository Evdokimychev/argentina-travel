"use client";

import { Check } from "lucide-react";
import {
  BOOKING_CHECKOUT_STEPS,
  resolveBookingCheckoutStepIndex,
  type BookingCheckoutStepId,
} from "@/lib/booking-checkout-steps";
import { cn } from "@/lib/cn";

export default function BookingCheckoutStepper({
  currentStep,
  className,
}: {
  currentStep: BookingCheckoutStepId;
  className?: string;
}) {
  const currentIndex = resolveBookingCheckoutStepIndex(currentStep);

  return (
    <nav aria-label="Этапы бронирования" className={cn("w-full", className)}>
      <ol className="relative flex items-start justify-between">
        <span
          className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 sm:top-[18px]"
          aria-hidden
        />
        <span
          className="absolute left-0 top-4 h-0.5 bg-brand transition-[width] duration-500 sm:top-[18px]"
          style={{
            width:
              currentIndex <= 0
                ? "0%"
                : `${(currentIndex / (BOOKING_CHECKOUT_STEPS.length - 1)) * 100}%`,
          }}
          aria-hidden
        />
        {BOOKING_CHECKOUT_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const upcoming = index > currentIndex;

          return (
            <li key={step.id} className="relative z-[1] flex min-w-0 flex-1 flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors sm:h-9 sm:w-9",
                  done && "border-brand bg-brand text-white",
                  active && "border-brand bg-white text-brand shadow-sm ring-4 ring-brand/10",
                  upcoming && "border-gray-200 bg-white text-slate"
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                ) : (
                  <span aria-hidden>{index + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  "mt-2 max-w-[4.5rem] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-xs",
                  active && "text-brand",
                  done && "text-charcoal",
                  upcoming && "text-slate"
                )}
              >
                <span className="sm:hidden">{step.shortLabel}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
