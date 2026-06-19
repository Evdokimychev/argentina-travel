"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { TourDetail } from "@/types";
import { tourDetailPromoHeadingClass } from "@/lib/tour-detail-ui";
import { useTourBooking } from "./TourBookingContext";
import PartnerTourBookingContactSection from "./PartnerTourBookingContactSection";

interface PartnerTourBookingModalProps {
  tour: TourDetail;
}

export default function PartnerTourBookingModal({ tour }: PartnerTourBookingModalProps) {
  const { partnerPreviewOpen, closePartnerBookingPreview } = useTourBooking();

  return (
    <Dialog
      open={partnerPreviewOpen}
      onOpenChange={(open) => {
        if (!open) closePartnerBookingPreview();
      }}
    >
      <DialogContent bottomSheet className="max-w-lg p-0">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={tourDetailPromoHeadingClass}>Tripster</p>
              <h2 className="font-heading text-xl font-bold text-charcoal">Подтверждение заявки</h2>
              <p className="mt-1 text-sm text-slate">
                Проверьте дату, состав группы и контакты перед отправкой на Tripster.
              </p>
            </div>
            <button
              type="button"
              onClick={closePartnerBookingPreview}
              className="rounded-lg p-1 text-slate hover:bg-gray-100"
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
