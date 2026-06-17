"use client";

import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTourBooking } from "./TourBookingContext";
import { WAITLIST_HINT } from "@/lib/tour-waitlist";

export default function BookingWaitlistPrompt() {
  const { waitlistScenario, openWaitlist, canJoinWaitlist } = useTourBooking();

  if (!canJoinWaitlist) return null;

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <ListOrdered className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-charcoal">
            {waitlistScenario.kind === "all_dates"
              ? "Сейчас нет мест для вашей группы"
              : "На эту дату не хватает мест"}
          </p>
          {waitlistScenario.reason ? (
            <p className="text-xs leading-relaxed text-slate">{waitlistScenario.reason}</p>
          ) : null}
          <p className="text-xs leading-relaxed text-slate">{WAITLIST_HINT}</p>
          <Button type="button" variant="outline" size="sm" className="mt-1" onClick={openWaitlist}>
            Встать в лист ожидания
          </Button>
        </div>
      </div>
    </div>
  );
}
