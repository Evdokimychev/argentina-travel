import { hasAnalyticsConsent } from "@/lib/cookie-consent";

/** Custom dataLayer event names — map to GA4 / Metrika in GTM. */
export const GTM_EVENTS = {
  bookingSubmit: "booking_submit",
  contactFormSubmit: "contact_form_submit",
  newsletterSubscribe: "newsletter_subscribe",
  whatsappClick: "whatsapp_click",
  telegramClick: "telegram_click",
  tourBookingClick: "tour_booking_click",
  excursionBookingClick: "excursion_booking_click",
  tourView: "tour_view",
  excursionView: "excursion_view",
} as const;

export type GtmEventName = (typeof GTM_EVENTS)[keyof typeof GTM_EVENTS];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

export function trackGtmEvent(
  event: GtmEventName,
  params?: Record<string, unknown>
): void {
  if (!hasAnalyticsConsent()) return;
  pushDataLayer({ event, ...params });
}

export function trackBookingSubmit(input: {
  productType: "tour" | "excursion";
  slug: string;
  title?: string;
  partner?: string;
  guests?: number;
  valueUsd?: number;
  source?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.bookingSubmit, {
    product_type: input.productType,
    item_id: input.slug,
    item_name: input.title,
    partner: input.partner,
    guests: input.guests,
    value: input.valueUsd,
    currency: "USD",
    source: input.source,
  });
}

export function trackContactFormSubmit(input: {
  source?: string;
  tourSlug?: string;
  productSlug?: string;
  serviceSlug?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.contactFormSubmit, {
    form_name: "contact",
    source: input.source ?? "contacts",
    tour_slug: input.tourSlug,
    product_slug: input.productSlug,
    service_slug: input.serviceSlug,
  });
}

export function trackNewsletterSubscribe(input: { source?: string } = {}): void {
  trackGtmEvent(GTM_EVENTS.newsletterSubscribe, {
    form_name: "newsletter",
    source: input.source ?? "footer",
  });
}

export function trackMessengerClick(input: {
  channel: "whatsapp" | "telegram";
  href: string;
  label?: string;
}): void {
  const event =
    input.channel === "whatsapp" ? GTM_EVENTS.whatsappClick : GTM_EVENTS.telegramClick;
  trackGtmEvent(event, {
    link_url: input.href,
    link_text: input.label,
    channel: input.channel,
  });
}

export function trackTourBookingClick(input: {
  slug: string;
  title?: string;
  action?: "checkout" | "external" | "partner_preview" | "waitlist";
  placement?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.tourBookingClick, {
    item_id: input.slug,
    item_name: input.title,
    booking_action: input.action ?? "checkout",
    placement: input.placement,
  });
}

export function trackExcursionBookingClick(input: {
  slug: string;
  title?: string;
  action?: "preview" | "affiliate";
  placement?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.excursionBookingClick, {
    item_id: input.slug,
    item_name: input.title,
    booking_action: input.action ?? "preview",
    placement: input.placement,
  });
}

export function trackTourView(input: {
  slug: string;
  title?: string;
  priceUsd?: number;
  organizerId?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.tourView, {
    item_id: input.slug,
    item_name: input.title,
    item_category: "tour",
    value: input.priceUsd,
    currency: "USD",
    organizer_id: input.organizerId,
  });
}

export function trackExcursionView(input: {
  slug: string;
  title?: string;
  partner?: string;
  cityName?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.excursionView, {
    item_id: input.slug,
    item_name: input.title,
    item_category: "excursion",
    partner: input.partner,
    city_name: input.cityName,
  });
}
