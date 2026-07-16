import type { TourBookingMode, TourDetail } from "@/types";
import type { OfferCapabilities, OfferSource } from "@/types/product-capability";

type TourCapabilityInput = {
  bookingMode?: TourBookingMode;
  partnerSource?: "tripster" | "youtravel";
  priceOnRequest?: boolean;
  customBookingLink?: TourDetail["customBookingLink"];
  offerCapabilities?: OfferCapabilities;
};

function partnerName(source: OfferSource): string {
  if (source === "tripster") return "Tripster";
  if (source === "youtravel") return "YouTravel.me";
  if (source === "sputnik8") return "Sputnik8";
  return "сайте партнёра";
}

export function externalPartnerCapabilities(source: OfferSource): OfferCapabilities {
  const name = partnerName(source);
  return {
    bookingMode: "external_partner",
    paymentMode: "partner",
    messagingMode: "partner",
    source,
    availabilityMode: "partner",
    cancellationOwner: "partner",
    primaryActionLabel:
      source === "other" ? "Перейти к бронированию у партнёра" : `Перейти к бронированию на ${name}`,
    disclosure:
      source === "other"
        ? "Бронирование, оплата и отмена оформляются на сайте партнёра."
        : `Бронирование, оплата и отмена оформляются на ${name}.`,
  };
}

export function disabledPartnerCapabilities(
  source: OfferSource,
  reason = "Партнёр временно не принимает бронирования этого предложения."
): OfferCapabilities {
  return {
    ...externalPartnerCapabilities(source),
    bookingMode: "disabled",
    paymentMode: "none",
    messagingMode: "none",
    availabilityMode: "unknown",
    cancellationOwner: "unknown",
    primaryActionLabel: "Бронирование недоступно",
    disclosure: reason,
    disabledReason: reason,
  };
}

export function resolveTourOfferCapabilities(tour: TourCapabilityInput): OfferCapabilities {
  if (tour.offerCapabilities) return tour.offerCapabilities;
  if (tour.partnerSource) return externalPartnerCapabilities(tour.partnerSource);
  if (tour.customBookingLink?.url) return externalPartnerCapabilities("other");

  if (tour.priceOnRequest || tour.bookingMode === "on_request") {
    return {
      bookingMode: "internal_request",
      paymentMode: "manual",
      messagingMode: "email",
      source: "goargentina",
      availabilityMode: "internal_live",
      cancellationOwner: "organizer",
      primaryActionLabel: tour.priceOnRequest ? "Запросить расчёт" : "Оставить заявку",
      disclosure: "Заявка сохраняется на GoArgentina. Условия и оплату подтверждает организатор.",
    };
  }

  return {
    bookingMode: "internal_checkout",
    paymentMode: "manual",
    messagingMode: "internal_chat",
    source: "goargentina",
    availabilityMode: "internal_live",
    cancellationOwner: "organizer",
    primaryActionLabel: "Оставить заявку",
    disclosure: "Заявка сохраняется на GoArgentina. Оплата доступна только после подтверждения условий.",
  };
}
