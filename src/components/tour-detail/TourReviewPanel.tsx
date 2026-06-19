"use client";

import type { TourDetail } from "@/types";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import TourReviewForm from "./TourReviewForm";

type TourReviewPanelProps = {
  tour: Pick<TourDetail, "id" | "slug" | "title" | "partnerSource">;
  organizerTourId?: string;
};

export default function TourReviewPanel({ tour, organizerTourId }: TourReviewPanelProps) {
  if (isPartnerTourDetail(tour)) return null;

  return (
    <div id="leave-review" className="scroll-mt-24">
      <TourReviewForm
        tourId={tour.id}
        tourSlug={tour.slug}
        tourTitle={tour.title}
        organizerTourId={organizerTourId}
      />
    </div>
  );
}
