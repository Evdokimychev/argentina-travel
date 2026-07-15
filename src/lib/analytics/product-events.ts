import { hasAnalyticsConsent } from "@/lib/cookie-consent";
import { pushDataLayer } from "@/lib/analytics/gtm-events";
import { reachYandexMetrikaGoal } from "@/lib/analytics/yandex-metrika";

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
  source?: string;
  campaign?: string;
  deviceClass?: "mobile" | "tablet" | "desktop";
  locale?: string;
  outcome?: string;
  errorCategory?: string;
  value?: number;
  count?: number;
};

const FORBIDDEN_VALUE = /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d))/i;

function safeText(value: string | undefined, maxLength = 160): string | undefined {
  const normalized = value?.trim().slice(0, maxLength);
  if (!normalized) return undefined;
  return FORBIDDEN_VALUE.test(normalized) ? "[redacted]" : normalized;
}

function anonymousSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const key = "goargentina-analytics-session";
  try {
    const current = window.sessionStorage.getItem(key);
    if (current) return current;
    const next = globalThis.crypto?.randomUUID?.() ?? `s-${Date.now().toString(36)}`;
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return undefined;
  }
}

export function sanitizeProductEventDetails(details: ProductEventDetails = {}): Record<string, ProductEventValue> {
  const route = safeText(details.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined));
  return {
    event_version: 2,
    session_id: anonymousSessionId(),
    role: safeText(details.role, 40),
    active_workspace: safeText(details.activeWorkspace, 40),
    route,
    entity_type: safeText(details.entityType, 60),
    entity_id: safeText(details.entityId, 120),
    source: safeText(details.source, 80),
    campaign: safeText(details.campaign, 80),
    device_class: details.deviceClass,
    locale: safeText(details.locale, 12),
    outcome: safeText(details.outcome, 60),
    error_category: safeText(details.errorCategory, 60),
    value: Number.isFinite(details.value) ? details.value : undefined,
    count: Number.isFinite(details.count) ? details.count : undefined,
    timestamp: new Date().toISOString(),
  };
}

export function trackProductEvent(name: ProductEventName, details: ProductEventDetails = {}): void {
  if (!hasAnalyticsConsent()) return;
  const payload = sanitizeProductEventDetails(details);
  pushDataLayer({ event: name, ...payload });
  reachYandexMetrikaGoal(name, payload);
}
