"use client";

import {
  resolveBookingCheckoutProgress,
  type BookingCheckoutStepId,
} from "@/lib/booking-checkout-steps";
import { cn } from "@/lib/cn";

export default function BookingCheckoutProgress({
  currentStep,
  className,
}: {
  currentStep: BookingCheckoutStepId;
  className?: string;
}) {
  const progress = resolveBookingCheckoutProgress(currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-3 text-xs text-slate">
        <span>Прогресс оформления</span>
        <span className="font-medium text-charcoal">{progress}%</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Прогресс оформления: ${progress} процентов`}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
