"use client";

import type { ReactNode } from "react";
import BookingCheckoutProgress from "@/components/booking/BookingCheckoutProgress";
import BookingCheckoutStepper from "@/components/booking/BookingCheckoutStepper";
import type { BookingCheckoutStepId } from "@/lib/booking-checkout-steps";
import { cn } from "@/lib/cn";

export default function BookingCheckoutShell({
  currentStep,
  eyebrow,
  title,
  description,
  children,
  className,
  showProgress = true,
}: {
  currentStep: BookingCheckoutStepId;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  showProgress?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-2xl px-4 py-8 sm:py-12", className)}>
      <div className="mb-6 space-y-4 sm:mb-8">
        <BookingCheckoutStepper currentStep={currentStep} />
        {showProgress ? <BookingCheckoutProgress currentStep={currentStep} /> : null}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-slate">{eyebrow}</p>
        ) : null}
        {title ? (
          <h1
            className={cn(
              "font-display text-2xl font-bold text-charcoal",
              eyebrow ? "mt-2" : undefined
            )}
          >
            {title}
          </h1>
        ) : null}
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate">{description}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
