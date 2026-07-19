import type { TourBookingMode, TourDetail } from "@/types";
import type { ExcursionDetail } from "@/types/excursion";
import type { OfferCapabilities, OfferSource } from "@/types/product-capability";

type TourCapabilityInput = {
  bookingMode?: TourBookingMode;
  partnerSource?: "tripster" | "youtravel";
  priceOnRequest?: boolean;
  customBookingLink?: TourDetail["customBookingLink"];
  offerCapabilities?: OfferCapabilities;
};

type ExcursionCapabilityInput = Pick<
  ExcursionDetail,
  | "partner"
  | "bookingHref"
  | "isBookable"
  | "tripsterPartnerApiConfigured"
  | "platformTourId"
  | "platformBookingMode"
  | "offerCapabilities"
>;

function partnerName(source: OfferSource): string {
  if (source === "tripster") return "Tripster";
  if (source === "youtravel") return "YouTravel.me";
  if (source === "sputnik8") return "Sputnik8";
  return "сайте партнёра";
}

export function externalPartnerCapabilities(
  source: OfferSource,
  experienceType: OfferCapabilities["experienceType"] = "tour"
): OfferCapabilities {
  const name = partnerName(source);
  return {
    bookingMode: "external_partner",
    paymentMode: "partner",
    messagingMode: "partner",
    source,
    availabilityMode: "partner",
    cancellationOwner: "partner",
    experienceType,
    contentOwner: source,
    dataSource: source,
    dataFreshness: "cached",
    confirmationMode: "partner",
    supportOwner: "partner",
    retryMode: "partner_handoff",
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
  reason = "Партнёр временно не принимает бронирования этого предложения.",
  experienceType: OfferCapabilities["experienceType"] = "tour"
): OfferCapabilities {
  return {
    ...externalPartnerCapabilities(source, experienceType),
    bookingMode: "disabled",
    paymentMode: "none",
    messagingMode: "none",
    availabilityMode: "unknown",
    cancellationOwner: "unknown",
    confirmationMode: "none",
    supportOwner: "platform",
    retryMode: "contact_support",
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
      experienceType: "tour",
      contentOwner: "goargentina",
      dataSource: "goargentina",
      dataFreshness: "live",
      confirmationMode: "organizer",
      supportOwner: "platform",
      retryMode: "same_operation",
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
    experienceType: "tour",
    contentOwner: "goargentina",
    dataSource: "goargentina",
    dataFreshness: "live",
    confirmationMode: "organizer",
    supportOwner: "platform",
    retryMode: "same_operation",
    primaryActionLabel: "Оставить заявку",
    disclosure: "Заявка сохраняется на GoArgentina. Оплата доступна только после подтверждения условий.",
  };
}

export function resolveExcursionOfferCapabilities(
  excursion: ExcursionCapabilityInput
): OfferCapabilities {
  if (excursion.offerCapabilities) return excursion.offerCapabilities;
  if (excursion.partner === "platform") {
    if (!excursion.platformTourId) {
      const reason = "Экскурсия пока доступна только для просмотра.";
      return {
        bookingMode: "information_only",
        paymentMode: "none",
        messagingMode: "none",
        source: "goargentina",
        availabilityMode: "static",
        cancellationOwner: "unknown",
        experienceType: "excursion",
        contentOwner: "goargentina",
        dataSource: "goargentina",
        dataFreshness: "manual",
        confirmationMode: "none",
        supportOwner: "platform",
        retryMode: "contact_support",
        primaryActionLabel: "Уточнить возможность бронирования",
        disclosure: reason,
        disabledReason: reason,
      };
    }

    const isRequest = excursion.platformBookingMode === "on_request";
    return {
      bookingMode: isRequest ? "internal_request" : "internal_checkout",
      paymentMode: "manual",
      messagingMode: "internal_chat",
      source: "goargentina",
      availabilityMode: "internal_live",
      cancellationOwner: "organizer",
      experienceType: "excursion",
      contentOwner: "goargentina",
      dataSource: "goargentina",
      dataFreshness: "live",
      confirmationMode: "organizer",
      supportOwner: "platform",
      retryMode: "same_operation",
      primaryActionLabel: isRequest ? "Оставить заявку" : "Запросить бронирование",
      disclosure: "Заявка сохраняется на GoArgentina. Условия и оплату подтверждает организатор.",
    };
  }

  const source = excursion.partner === "sputnik8" ? "sputnik8" : "tripster";
  if (!excursion.bookingHref?.trim()) {
    return disabledPartnerCapabilities(source, undefined, "excursion");
  }
  if (source === "tripster" && excursion.isBookable === false) {
    return disabledPartnerCapabilities(source, undefined, "excursion");
  }

  return externalPartnerCapabilities(source, "excursion");
}
