"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DialogPanelHeader } from "@/components/ui/dialog-panel-header";
import type { TourDetail } from "@/types";
import { tourDetailPromoHeadingClass } from "@/lib/tour-detail-ui";
import { isYouTravelPartnerDetail } from "@/lib/youtravel/partner-tour-utils";
import { useTourBooking } from "./TourBookingContext";
import PartnerTourBookingContactSection from "./PartnerTourBookingContactSection";

interface PartnerTourBookingModalProps {
  tour: TourDetail;
}

export default function PartnerTourBookingModal({ tour }: PartnerTourBookingModalProps) {
  const { partnerPreviewOpen, closePartnerBookingPreview } = useTourBooking();
  const isYouTravel = isYouTravelPartnerDetail(tour);
  const partnerLabel = isYouTravel ? "YouTravel.me" : "Tripster";

  return (
    <Dialog
      open={partnerPreviewOpen}
      onOpenChange={(open) => {
        if (!open) closePartnerBookingPreview();
      }}
    >
      <DialogContent
        bottomSheet
        showClose={false}
        className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">{`Подтверждение заявки на тур ${partnerLabel}`}</DialogTitle>
        <DialogDescription className="sr-only">
          Проверьте дату, состав группы и контакты перед отправкой.
        </DialogDescription>

        <DialogPanelHeader
          onClose={closePartnerBookingPreview}
          eyebrow={<p className={tourDetailPromoHeadingClass}>{partnerLabel}</p>}
          title="Подтверждение заявки"
          description={`Проверьте дату, состав группы и контакты перед отправкой на ${partnerLabel}.`}
        />

        <div className="px-5 py-5 sm:px-6">
          <PartnerTourBookingContactSection tour={tour} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
