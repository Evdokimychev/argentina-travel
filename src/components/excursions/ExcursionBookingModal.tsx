"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DialogPanelHeader } from "@/components/ui/dialog-panel-header";
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
      <DialogContent
        bottomSheet
        showClose={false}
        className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">Подтверждение заявки на экскурсию</DialogTitle>
        <DialogDescription className="sr-only">
          Проверьте дату, время, состав группы и контакты перед отправкой.
        </DialogDescription>

        <DialogPanelHeader
          onClose={closeBookingPreview}
          eyebrow={<p className={tourDetailPromoHeadingClass}>{partnerLabel}</p>}
          title="Подтверждение заявки"
          description="Проверьте дату, время, состав группы и контакты перед отправкой."
        />

        <div className="px-5 py-5 sm:px-6">
          <ExcursionBookingContactSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}
