import {
  sanitizeAnalyticsParams,
  type AnalyticsScalar,
} from "@/lib/analytics/event-contract";

export const OPERATIONAL_ANALYTICS_EVENT_DICTIONARY = {
  booking_capability_view: {
    required: [
      "product_type",
      "product_id",
      "booking_mode",
      "payment_mode",
      "source",
      "confirmation_mode",
      "support_owner",
      "data_freshness",
      "placement",
    ],
    optional: [],
    enums: {
      product_type: ["tour", "excursion"],
      booking_mode: [
        "native_request",
        "partner_external",
        "affiliate_redirect",
        "information_only",
        "payment_link",
      ],
    },
  },
  booking_transition: {
    required: ["outcome", "placement", "operation_id"],
    optional: ["product_type", "product_id", "partner", "fallback_reason"],
    enums: {
      product_type: ["tour", "excursion"],
      outcome: [
        "native_request_created",
        "partner_order_created",
        "partner_handoff",
        "disabled",
      ],
    },
  },
  booking_error: {
    required: ["stage", "retryable", "support_owner", "http_status_class"],
    optional: ["product_type", "product_id", "partner"],
    enums: {
      product_type: ["tour", "excursion"],
      stage: ["capability", "validation", "submit", "redirect", "confirmation"],
      http_status_class: ["none", "2xx", "3xx", "4xx", "5xx"],
    },
  },
  inventory_update_rejected: {
    required: ["reason"],
    optional: ["entity_type", "product_id", "actor_role"],
    enums: {
      reason: ["capacity_below_booked", "invalid_date", "invalid_status"],
    },
  },
  moderation_conflict: {
    required: ["action", "expected_state", "actual_state"],
    optional: ["entity_type", "product_id", "actor_role"],
    enums: {},
  },
} as const;

export type OperationalAnalyticsEventType = keyof typeof OPERATIONAL_ANALYTICS_EVENT_DICTIONARY;

const REDACTED_VALUE = "[redacted]";

export function isOperationalAnalyticsEventType(
  value: string,
): value is OperationalAnalyticsEventType {
  return Object.hasOwn(OPERATIONAL_ANALYTICS_EVENT_DICTIONARY, value);
}

/**
 * Operational events are deliberately narrower than generic tag-manager events.
 * Unknown fields are discarded, required fields fail closed and a value that looks
 * like contact data rejects the whole event instead of persisting a redaction marker.
 */
export function validateOperationalEventMetadata(
  eventType: OperationalAnalyticsEventType,
  metadata: Record<string, unknown>,
): Record<string, AnalyticsScalar> | null {
  const sanitizedAll = sanitizeAnalyticsParams(metadata);
  if (Object.values(sanitizedAll).some((value) => value === REDACTED_VALUE)) return null;

  const schema = OPERATIONAL_ANALYTICS_EVENT_DICTIONARY[eventType];
  const allowed = new Set<string>([...schema.required, ...schema.optional]);
  const normalized: Record<string, AnalyticsScalar> = {};

  for (const [key, value] of Object.entries(sanitizedAll)) {
    if (allowed.has(key)) normalized[key] = value;
  }

  for (const key of schema.required) {
    const value = normalized[key];
    if (value === undefined || value === null || value === "") return null;
  }
  if (eventType === "booking_error" && typeof normalized.retryable !== "boolean") return null;

  const enums = schema.enums as Record<string, readonly string[]>;
  for (const [key, allowedValues] of Object.entries(enums)) {
    const value = normalized[key];
    if (value !== undefined && (typeof value !== "string" || !allowedValues.includes(value))) {
      return null;
    }
  }

  return normalized;
}
