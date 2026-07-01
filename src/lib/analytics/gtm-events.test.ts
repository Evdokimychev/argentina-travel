import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookie-consent";
import {
  GTM_EVENTS,
  pushDataLayer,
  trackGtmEvent,
  trackTourView,
  type GtmEventName,
} from "@/lib/analytics/gtm-events";

/** Expected dataLayer param keys per event (for GTM variable mapping). */
export const GTM_EVENT_PARAM_SHAPE: Record<GtmEventName, string[]> = {
  booking_submit: [
    "product_type",
    "item_id",
    "item_name",
    "partner",
    "guests",
    "value",
    "currency",
    "source",
  ],
  contact_form_submit: ["form_name", "source", "tour_slug", "product_slug", "service_slug"],
  newsletter_subscribe: ["form_name", "source"],
  whatsapp_click: ["link_url", "link_text", "channel"],
  telegram_click: ["link_url", "link_text", "channel"],
  tour_booking_click: ["item_id", "item_name", "booking_action", "placement"],
  excursion_booking_click: ["item_id", "item_name", "booking_action", "placement"],
  tour_view: ["item_id", "item_name", "item_category", "value", "currency", "organizer_id"],
  excursion_view: ["item_id", "item_name", "item_category", "partner", "city_name"],
  blog_article_save: ["item_id", "item_name", "save_action", "source"],
  blog_affiliate_click: ["item_id", "affiliate_service", "link_url"],
  blog_inline_related_click: ["source_slug", "item_id", "item_name", "placement"],
  blog_article_view: ["item_id", "item_name", "item_category"],
  blog_article_feedback: ["item_id", "item_name", "feedback_value"],
  blog_comment_post: ["item_id", "item_name"],
  blog_affiliate_embed_view: ["item_id", "affiliate_service"],
};

describe("gtm-events", () => {
  beforeEach(() => {
    const dataLayer: Record<string, unknown>[] = [];
    const storage = new Map<string, string>();
    storage.set(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({
        necessary: true,
        analytics: true,
        personalization: false,
        decidedAt: new Date().toISOString(),
      }),
    );

    vi.stubGlobal("window", {
      dataLayer,
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GTM_EVENTS values are unique snake_case strings", () => {
    const values = Object.values(GTM_EVENTS);
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(value).toMatch(/^[a-z0-9_]+$/);
    }
    expect(Object.keys(GTM_EVENT_PARAM_SHAPE).sort()).toEqual(values.slice().sort());
  });

  it("pushDataLayer appends to window.dataLayer", () => {
    pushDataLayer({ event: "test" });
    expect(window.dataLayer).toEqual([{ event: "test" }]);
  });

  it("trackGtmEvent sends named event when analytics consent granted", () => {
    trackGtmEvent(GTM_EVENTS.contactFormSubmit, { form_name: "contact" });
    expect(window.dataLayer?.[0]).toMatchObject({
      event: GTM_EVENTS.contactFormSubmit,
      form_name: "contact",
    });
  });

  it("trackTourView includes tour metadata", () => {
    trackTourView({ slug: "patagonia-14", title: "Патагония 14 дней", priceUsd: 1200 });
    expect(window.dataLayer?.[0]).toMatchObject({
      event: GTM_EVENTS.tourView,
      item_id: "patagonia-14",
      item_category: "tour",
      value: 1200,
    });
  });
});
