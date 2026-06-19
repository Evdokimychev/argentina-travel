"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Subtle success indicator — no confetti, only confirmed payment states. */
export default function BookingPaymentSuccessCelebration({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      <div className="relative">
        <span
          className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20"
          aria-hidden
        />
        <span
          className="absolute -inset-2 rounded-full bg-emerald-100/60"
          aria-hidden
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50">
          <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
        </div>
      </div>
    </div>
  );
}
