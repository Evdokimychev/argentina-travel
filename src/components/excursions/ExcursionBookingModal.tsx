"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { touchTargetIconClass } from "@/lib/responsive-ui";
import { cn } from "@/lib/cn";
import { tourDetailPromoHeadingClass } from "@/lib/tour-detail-ui";
import { useExcursionBooking } from "@/components/excursions/ExcursionBookingContext";
import ExcursionBookingContactSection from "@/components/excursions/ExcursionBookingContactSection";

export default function ExcursionBookingModal() {
  const { excursion, bookingPreviewOpen, closeBookingPreview } = useExcursionBooking();

  const partnerLabel = excursion.partner === "sputnik8" ? "Sputnik8" : "Tripster";

  return (
    <Dialog
      open={bookingPreviewOpen}
      onOpenChange={(open) => {
        if (!open) closeBookingPreview();
      }}
    >
      <DialogContent bottomSheet showClose={false} className="max-w-lg p-0">
        <DialogTitle className="sr-only">Подтверждение заявки на экскурсию</DialogTitle>
        <DialogDescription className="sr-only">
          Проверьте дату, время, состав группы и контакты перед отправкой.
        </DialogDescription>
        <div className="border-b border-gray-100 px-5 py-4 pr-14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={tourDetailPromoHeadingClass}>{partnerLabel}</p>
              <p className="font-heading text-xl font-bold text-charcoal">Подтверждение заявки</p>
              <p className="mt-1 text-sm text-slate">
                Проверьте дату, время, состав группы и контакты перед отправкой.
              </p>
            </div>
            <button
              type="button"
              onClick={closeBookingPreview}
              className={cn(touchTargetIconClass, "rounded-lg text-slate hover:bg-gray-100")}
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <ExcursionBookingContactSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}
