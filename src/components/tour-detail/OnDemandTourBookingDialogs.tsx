"use client";

import dynamic from "next/dynamic";
import type { TourDetail } from "@/types";
import { useTourBooking } from "./TourBookingContext";

const PartnerTourBookingModal = dynamic(() => import("./PartnerTourBookingModal"), {
  ssr: false,
});
const TourPriceRequestModal = dynamic(() => import("./TourPriceRequestModal"), {
  ssr: false,
});
const TourCheckoutModal = dynamic(() => import("./checkout/TourCheckoutModal"), {
  ssr: false,
});
const TourWaitlistModal = dynamic(() => import("./TourWaitlistModal"), {
  ssr: false,
});

type OnDemandTourBookingDialogsProps = {
  tour: TourDetail;
  isPartnerTour: boolean;
};

/**
 * Keeps every booking trigger immediately interactive while excluding closed
 * dialog implementations from the route's initial mobile JavaScript.
 */
export default function OnDemandTourBookingDialogs({
  tour,
  isPartnerTour,
}: OnDemandTourBookingDialogsProps) {
  const {
    checkoutOpen,
    partnerPreviewOpen,
    priceRequestOpen,
    usesExternalBooking,
    waitlistOpen,
  } = useTourBooking();

  if (usesExternalBooking && isPartnerTour) {
    return partnerPreviewOpen ? <PartnerTourBookingModal tour={tour} /> : null;
  }

  if (usesExternalBooking) return null;

  return (
    <>
      {priceRequestOpen ? <TourPriceRequestModal tour={tour} /> : null}
      {checkoutOpen && !tour.priceOnRequest ? <TourCheckoutModal tour={tour} /> : null}
      {waitlistOpen && tour.waitlistEnabled && !tour.priceOnRequest ? (
        <TourWaitlistModal tour={tour} />
      ) : null}
    </>
  );
}
