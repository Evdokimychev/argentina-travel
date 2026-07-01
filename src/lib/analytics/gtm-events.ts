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
  blogArticleSave: "blog_article_save",
  blogAffiliateClick: "blog_affiliate_click",
  blogInlineRelatedClick: "blog_inline_related_click",
  blogArticleView: "blog_article_view",
  blogArticleFeedback: "blog_article_feedback",
  blogCommentPost: "blog_comment_post",
  blogAffiliateEmbedView: "blog_affiliate_embed_view",
  localeSwitch: "locale_switch",
  searchSubmit: "search_submit",
  searchResultClick: "search_result_click",
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
  trackGtmEvent(GTM_EVENTS.localeSwitch, {
    locale_from: input.from,
    locale_to: input.to,
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
    search_term: input.query,
    results_count: input.resultsCount,
    search_source: input.source,
    search_kind: input.kind ?? "all",
  });
}

export function trackSearchResultClick(input: {
  query: string;
  itemId: string;
  itemKind: string;
  position: number;
  source: "meilisearch" | "postgres" | "static";
}): void {
  trackGtmEvent(GTM_EVENTS.searchResultClick, {
    search_term: input.query,
    item_id: input.itemId,
    item_kind: input.itemKind,
    position: input.position,
    search_source: input.source,
  });
}
