import { hasAnalyticsConsent } from "@/lib/cookie-consent";
import { pushDataLayer } from "@/lib/analytics/gtm-events";
import { reachYandexMetrikaGoal } from "@/lib/analytics/yandex-metrika";
import {
  createAnalyticsEventPayload,
  sanitizeAnalyticsParams,
  type BookingMode,
  type ProductType,
} from "@/lib/analytics/event-contract";

export const PRODUCT_EVENT_NAMES = [
  "intent_selected", "site_search_started", "site_search_completed", "site_search_zero_results",
  "destination_opened", "place_opened", "article_opened", "article_depth", "related_content_clicked",
  "map_opened", "map_marker_selected", "map_filter_changed", "map_zero_results", "airport_selected",
  "airport_route_selected", "flights_search_started", "flights_widget_ready", "flights_widget_error",
  "flights_results_opened", "signup_started", "signup_completed", "profile_completed", "favorite_added",
  "itinerary_started", "booking_started", "booking_created", "booking_confirmed", "payment_started",
  "payment_completed", "booking_cancelled", "review_submitted", "organizer_onboarding_started",
  "organizer_profile_completed", "tour_draft_created", "tour_submitted", "tour_published",
  "article_draft_created", "article_submitted", "article_returned", "article_published", "booking_opened",
  "booking_response_sent", "payout_opened", "admin_task_opened", "admin_task_resolved",
  "moderation_started", "moderation_completed", "content_published", "payment_issue_resolved",
  "platform_alert_opened",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];
export type ProductEventValue = string | number | boolean | null | undefined;
export type ProductEventDetails = {
  role?: string;
  activeWorkspace?: string;
  route?: string;
  entityType?: string;
  entityId?: string;
  productId?: string;
  productType?: ProductType;
  bookingMode?: BookingMode;
  source?: string;
  campaign?: string;
  deviceClass?: "mobile" | "tablet" | "desktop";
  locale?: string;
  outcome?: string;
  errorCategory?: string;
  value?: number;
  count?: number;
};

export function sanitizeProductEventDetails(details: ProductEventDetails = {}): Record<string, ProductEventValue> {
  const route = details.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined);
  return sanitizeAnalyticsParams({
    role: details.role,
    active_workspace: details.activeWorkspace,
    route,
    entity_type: details.entityType,
    entity_id: details.entityId,
    product_id: details.productId,
    product_type: details.productType,
    booking_mode: details.bookingMode,
    source: details.source,
    campaign: details.campaign,
    device_class: details.deviceClass,
    locale: details.locale,
    outcome: details.outcome,
    error_category: details.errorCategory,
    value: details.value,
    count: details.count,
  });
}

export function trackProductEvent(name: ProductEventName, details: ProductEventDetails = {}): void {
  if (!hasAnalyticsConsent()) return;
  const payload = createAnalyticsEventPayload(sanitizeProductEventDetails(details));
  pushDataLayer({ event: name, ...payload });
  reachYandexMetrikaGoal(name, payload);
}
