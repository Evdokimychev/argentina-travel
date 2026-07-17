export type OfferBookingMode =
  | "external_partner"
  | "internal_request"
  | "internal_checkout"
  | "lead_to_manager"
  | "information_only"
  | "disabled";

export type OfferPaymentMode =
  | "partner"
  | "manual"
  | "payment_link"
  | "online_checkout"
  | "none";

export type OfferMessagingMode = "partner" | "email" | "internal_chat" | "none";
export type OfferSource = "goargentina" | "tripster" | "youtravel" | "sputnik8" | "other";
export type OfferAvailabilityMode = "partner" | "internal_live" | "static" | "unknown";
export type OfferCancellationOwner = "platform" | "organizer" | "partner" | "unknown";
export type OfferExperienceType = "tour" | "excursion";
export type OfferDataFreshness = "live" | "cached" | "manual" | "unknown";
export type OfferConfirmationMode = "organizer" | "partner" | "instant" | "none";
export type OfferSupportOwner = "platform" | "organizer" | "partner" | "none";
export type OfferRetryMode = "same_operation" | "partner_handoff" | "contact_support" | "none";

export interface OfferCapabilities {
  bookingMode: OfferBookingMode;
  paymentMode: OfferPaymentMode;
  messagingMode: OfferMessagingMode;
  source: OfferSource;
  availabilityMode: OfferAvailabilityMode;
  cancellationOwner: OfferCancellationOwner;
  experienceType: OfferExperienceType;
  contentOwner: OfferSource;
  dataSource: OfferSource;
  dataFreshness: OfferDataFreshness;
  confirmationMode: OfferConfirmationMode;
  supportOwner: OfferSupportOwner;
  retryMode: OfferRetryMode;
  primaryActionLabel: string;
  disclosure: string;
  disabledReason?: string;
}
