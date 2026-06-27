"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { touchTargetIconClass } from "@/lib/responsive-ui";
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
      <DialogContent bottomSheet showClose={false} className="max-w-lg p-0">
        <DialogTitle className="sr-only">{`Подтверждение заявки на тур ${partnerLabel}`}</DialogTitle>
        <DialogDescription className="sr-only">
          Проверьте дату, состав группы и контакты перед отправкой.
        </DialogDescription>
        <div className="border-b border-gray-100 px-5 py-4 pr-14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={tourDetailPromoHeadingClass}>{partnerLabel}</p>
              <p className="font-heading text-xl font-bold text-charcoal">Подтверждение заявки</p>
              <p className="mt-1 text-sm text-slate">
                {`Проверьте дату, состав группы и контакты перед отправкой на ${partnerLabel}.`}
              </p>
            </div>
            <button
              type="button"
              onClick={closePartnerBookingPreview}
              className={cn(touchTargetIconClass, "rounded-lg text-slate hover:bg-gray-100")}
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <PartnerTourBookingContactSection tour={tour} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
