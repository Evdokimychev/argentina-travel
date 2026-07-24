import { hasAnalyticsConsent } from "@/lib/cookie-consent";
import {
  createAnalyticsEventPayload,
  type BookingMode,
  type BookingOutcome,
} from "@/lib/analytics/event-contract";

/** Custom dataLayer event names — map to GA4 in GTM; Metrika goals in Yandex UI. */
export const GTM_EVENTS = {
  bookingSubmit: "booking_submit",
  bookingStart: "booking_start",
  bookingError: "booking_error",
  contactFormSubmit: "contact_form_submit",
  newsletterSubscribe: "newsletter_subscribe",
  whatsappClick: "whatsapp_click",
  telegramClick: "telegram_click",
  tourBookingClick: "tour_booking_click",
  excursionBookingClick: "excursion_booking_click",
  partnerCheckoutClick: "partner_checkout_click",
  tourCardImpression: "tour_card_impression",
  tourCardClick: "tour_card_click",
  tourView: "tour_view",
  tourDetailView: "tour_detail_view",
  tourDateSelect: "tour_date_select",
  tourPeopleChange: "tour_people_change",
  excursionView: "excursion_view",
  blogArticleSave: "blog_article_save",
  blogAffiliateClick: "blog_affiliate_click",
  blogInlineRelatedClick: "blog_inline_related_click",
  blogArticleView: "blog_article_view",
  blogArticleFeedback: "blog_article_feedback",
  blogCommentPost: "blog_comment_post",
  blogAffiliateEmbedView: "blog_affiliate_embed_view",
  localeSwitch: "locale_switch",
  localeChange: "locale_change",
  currencyChange: "currency_change",
  searchSubmit: "search_submit",
  searchResultClick: "search_result_click",
  searchZeroResults: "search_zero_results",
  public404: "public_404",
  public503: "public_503",
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
  pushDataLayer({ ...createAnalyticsEventPayload(params), event });
}

function bookingSubmitSemantics(input: {
  partner?: string;
  source?: string;
  bookingMode?: BookingMode;
  outcome?: BookingOutcome;
}): { bookingMode: BookingMode; outcome: BookingOutcome } {
  if (input.bookingMode && input.outcome) {
    return { bookingMode: input.bookingMode, outcome: input.outcome };
  }
  const source = input.source?.toLowerCase() ?? "";
  if (source.includes("fallback")) {
    return { bookingMode: "affiliate_redirect", outcome: "fallback" };
  }
  const partner = input.partner?.trim().toLowerCase();
  const isPlatformOwned = !partner || ["platform", "native", "internal"].includes(partner);
  if (!isPlatformOwned) {
    return { bookingMode: "partner_external", outcome: "partner_redirect" };
  }
  return { bookingMode: "native_request", outcome: "native_success" };
}

export function trackBookingSubmit(input: {
  productType: "tour" | "excursion";
  slug: string;
  title?: string;
  partner?: string;
  guests?: number;
  valueUsd?: number;
  source?: string;
  bookingMode?: BookingMode;
  outcome?: BookingOutcome;
}): void {
  const semantics = bookingSubmitSemantics(input);
  trackGtmEvent(GTM_EVENTS.bookingSubmit, {
    product_type: input.productType,
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    partner: input.partner,
    guests: input.guests,
    value: input.valueUsd,
    currency: "USD",
    source: input.source,
    booking_mode: semantics.bookingMode,
    outcome: semantics.outcome,
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
  const bookingMode: BookingMode =
    input.action === "external" || input.action === "partner_preview"
      ? "partner_external"
      : input.action === "waitlist"
        ? "information_only"
        : "native_request";
  trackGtmEvent(GTM_EVENTS.tourBookingClick, {
    product_type: "tour",
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    booking_action: input.action ?? "checkout",
    placement: input.placement,
    source: input.placement,
    booking_mode: bookingMode,
    outcome: "started",
  });
  trackGtmEvent(GTM_EVENTS.bookingStart, {
    product_type: "tour",
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    booking_action: input.action ?? "checkout",
    placement: input.placement,
    booking_mode: bookingMode,
  });
  if (bookingMode === "partner_external") {
    trackGtmEvent(GTM_EVENTS.partnerCheckoutClick, {
      product_type: "tour",
      product_id: input.slug,
      item_id: input.slug,
      item_name: input.title,
      booking_action: input.action ?? "checkout",
      placement: input.placement,
      booking_mode: bookingMode,
      outcome: "started",
    });
  }
}

export function trackExcursionBookingClick(input: {
  slug: string;
  title?: string;
  action?: "preview" | "affiliate";
  placement?: string;
}): void {
  const bookingMode: BookingMode =
    input.action === "affiliate" ? "affiliate_redirect" : "partner_external";
  trackGtmEvent(GTM_EVENTS.excursionBookingClick, {
    product_type: "excursion",
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    booking_action: input.action ?? "preview",
    placement: input.placement,
    source: input.placement,
    booking_mode: bookingMode,
    outcome: "started",
  });
}

export function trackTourView(input: {
  slug: string;
  title?: string;
  priceUsd?: number;
  organizerId?: string;
}): void {
  if (!hasAnalyticsConsent()) return;
  const payload = createAnalyticsEventPayload({
    product_type: "tour",
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    item_category: "tour",
    value: input.priceUsd,
    currency: "USD",
    organizer_id: input.organizerId,
  });
  pushDataLayer({ ...payload, event: GTM_EVENTS.tourView });
  pushDataLayer({ ...payload, event: GTM_EVENTS.tourDetailView });
  if (typeof fetch !== "function") return;
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventType: "tour_view",
      eventId: payload.event_id,
      sessionId: payload.session_id,
      tourSlug: input.slug,
      tourId: input.slug,
      metadata: {
        product_type: "tour",
        source: "tour_detail",
        event_version: payload.event_version,
      },
    }),
  }).catch(() => undefined);
}

export function trackExcursionView(input: {
  slug: string;
  title?: string;
  partner?: string;
  cityName?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.excursionView, {
    product_type: "excursion",
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    item_category: "excursion",
    partner: input.partner,
    city_name: input.cityName,
  });
}

export function trackBlogArticleSave(input: {
  slug: string;
  title?: string;
  action: "add" | "remove";
  source?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.blogArticleSave, {
    item_id: input.slug,
    item_name: input.title,
    save_action: input.action,
    source: input.source ?? "blog_article",
  });
}

export function trackBlogAffiliateClick(input: {
  slug: string;
  service: string;
  href: string;
}): void {
  trackGtmEvent(GTM_EVENTS.blogAffiliateClick, {
    item_id: input.slug,
    affiliate_service: input.service,
    link_url: input.href,
  });
}

export function trackBlogInlineRelatedClick(input: {
  sourceSlug: string;
  targetSlug: string;
  targetTitle?: string;
  placement?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.blogInlineRelatedClick, {
    source_slug: input.sourceSlug,
    item_id: input.targetSlug,
    item_name: input.targetTitle,
    placement: input.placement ?? "inline_related",
  });
}

export function trackBlogArticleView(input: {
  slug: string;
  title?: string;
  category?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.blogArticleView, {
    item_id: input.slug,
    item_name: input.title,
    item_category: input.category,
  });
}

export function trackBlogArticleFeedback(input: {
  slug: string;
  title?: string;
  value: "helpful" | "not_helpful";
}): void {
  trackGtmEvent(GTM_EVENTS.blogArticleFeedback, {
    item_id: input.slug,
    item_name: input.title,
    feedback_value: input.value,
  });
}

export function trackBlogCommentPost(input: { slug: string; title?: string }): void {
  trackGtmEvent(GTM_EVENTS.blogCommentPost, {
    item_id: input.slug,
    item_name: input.title,
  });
}

export function trackBlogAffiliateEmbedView(input: {
  slug: string;
  service: string;
}): void {
  trackGtmEvent(GTM_EVENTS.blogAffiliateEmbedView, {
    item_id: input.slug,
    affiliate_service: input.service,
  });
}

export function trackLocaleSwitch(input: {
  from: string;
  to: string;
  path: string;
}): void {
  const params = {
    locale_from: input.from,
    locale_to: input.to,
    page_path: input.path,
  };
  trackGtmEvent(GTM_EVENTS.localeSwitch, params);
  trackGtmEvent(GTM_EVENTS.localeChange, params);
}

export function trackCurrencyChange(input: {
  from: string;
  to: string;
  path: string;
}): void {
  trackGtmEvent(GTM_EVENTS.currencyChange, {
    currency_from: input.from,
    currency_to: input.to,
    page_path: input.path,
  });
}

export function trackSearchSubmit(input: {
  query: string;
  resultsCount: number;
  source: "meilisearch" | "postgres" | "static";
  kind?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.searchSubmit, {
    search_query_length: input.query.trim().length,
    results_count: input.resultsCount,
    search_source: input.source,
    search_kind: input.kind ?? "all",
  });
  if (input.resultsCount === 0) {
    trackGtmEvent(GTM_EVENTS.searchZeroResults, {
      search_query_length: input.query.trim().length,
      results_count: 0,
      search_source: input.source,
      search_kind: input.kind ?? "all",
    });
  }
}

export function trackSearchResultClick(input: {
  query: string;
  itemId: string;
  itemKind: string;
  position: number;
  source: "meilisearch" | "postgres" | "static";
}): void {
  trackGtmEvent(GTM_EVENTS.searchResultClick, {
    search_query_length: input.query.trim().length,
    item_id: input.itemId,
    item_kind: input.itemKind,
    position: input.position,
    search_source: input.source,
  });
}

export function trackTourCardImpression(input: {
  slug: string;
  title?: string;
  placement?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.tourCardImpression, {
    product_type: "tour",
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    placement: input.placement ?? "catalog_card",
  });
}

export function trackTourCardClick(input: {
  slug: string;
  title?: string;
  placement?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.tourCardClick, {
    product_type: "tour",
    product_id: input.slug,
    item_id: input.slug,
    item_name: input.title,
    placement: input.placement ?? "catalog_card",
  });
}

export function trackTourDateSelect(input: {
  slug: string;
  dateId: string;
}): void {
  trackGtmEvent(GTM_EVENTS.tourDateSelect, {
    product_type: "tour",
    product_id: input.slug,
    item_id: input.slug,
    date_id: input.dateId,
  });
}

export function trackTourPeopleChange(input: {
  slug: string;
  guests: number;
}): void {
  trackGtmEvent(GTM_EVENTS.tourPeopleChange, {
    product_type: "tour",
    product_id: input.slug,
    item_id: input.slug,
    guests: input.guests,
  });
}

export function trackBookingError(input: {
  productType: "tour" | "excursion";
  slug: string;
  source?: string;
  message?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.bookingError, {
    product_type: input.productType,
    product_id: input.slug,
    item_id: input.slug,
    source: input.source,
    error_message: input.message?.slice(0, 120),
    outcome: "error",
  });
}

export function trackPublic404(input: { path?: string } = {}): void {
  trackGtmEvent(GTM_EVENTS.public404, {
    page_path: input.path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
  });
}

export function trackPublic503(input: {
  path?: string;
  slug?: string;
  errorClass?: string;
}): void {
  trackGtmEvent(GTM_EVENTS.public503, {
    page_path: input.path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    product_id: input.slug,
    error_class: input.errorClass,
  });
}
