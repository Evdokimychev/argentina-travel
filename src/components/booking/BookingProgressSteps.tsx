import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Booking } from "@/types/tourist";
import { resolveBookingProgressSteps } from "@/lib/booking-progress";

export default function BookingProgressSteps({ booking }: { booking: Booking }) {
  const { steps, cancelled } = resolveBookingProgressSteps(booking);

  return (
    <div>
      {cancelled ? (
        <p className="mb-3 text-sm font-medium text-muted">Заявка отменена</p>
      ) : null}
      <ol className="grid gap-3 sm:grid-cols-4 sm:gap-2">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="relative flex items-start gap-3 sm:block sm:text-center">
              {!isLast ? (
                <span
                  className="absolute left-[15px] top-8 hidden h-[calc(100%-8px)] w-px bg-border-subtle sm:left-[calc(50%+18px)] sm:top-4 sm:block sm:h-px sm:w-[calc(100%-36px)]"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold sm:mx-auto",
                  step.state === "done" && "border-sky bg-sky text-white",
                  step.state === "current" && "border-sky bg-sky/10 text-sky ring-4 ring-sky/15",
                  step.state === "upcoming" && "border-border-subtle bg-surface-elevated text-muted"
                )}
                aria-hidden
              >
                {step.state === "done" ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
              </span>
              <div className="min-w-0 pt-0.5 sm:pt-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.state === "current" && "text-sky",
                    step.state === "done" && "text-foreground",
                    step.state === "upcoming" && "text-muted"
                  )}
                >
                  {step.label}
                </p>
                {step.state === "current" && !cancelled ? (
                  <p className="mt-0.5 text-xs text-muted">Текущий этап</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
