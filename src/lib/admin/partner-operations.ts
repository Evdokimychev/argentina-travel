/**
 * Marketplace operations contract — Iteration 3.
 * Partner HTTP 200 is never enough for a public card.
 */

export const PARTNER_OFFER_STATES = [
  "publishable",
  "degraded",
  "temporarily_unavailable",
  "quarantined",
  "rejected",
] as const;

export type PartnerOfferState = (typeof PARTNER_OFFER_STATES)[number];

export const PARTNER_OFFER_STATE_LABELS: Record<PartnerOfferState, string> = {
  publishable: "Можно показывать",
  degraded: "Ограниченно",
  temporarily_unavailable: "Временно недоступно",
  quarantined: "Карантин",
  rejected: "Отклонено",
};

export const PARTNER_FIELD_OWNERSHIP = {
  title: "overrideable",
  shortDescription: "overrideable",
  image: "overrideable",
  destination: "overrideable",
  price: "provider-owned",
  dates: "provider-owned",
  bookingUrl: "provider-owned",
  slug: "derived",
  qualityState: "derived",
} as const;

export type PartnerFieldOwnership = typeof PARTNER_FIELD_OWNERSHIP;

export function partnerFieldOwner(
  field: keyof PartnerFieldOwnership,
): PartnerFieldOwnership[keyof PartnerFieldOwnership] {
  return PARTNER_FIELD_OWNERSHIP[field];
}
