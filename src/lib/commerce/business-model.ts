/**
 * Production-enabled commercial modes for GoArgentina.
 * Readiness and dashboards must score only enabled modes —
 * intentionally disabled future capabilities are not blockers.
 */
export const COMMERCIAL_MODE_IDS = [
  "own_lead",
  "partner_redirect",
  "affiliate",
  "own_booking",
  "own_payment",
] as const;

export type CommercialModeId = (typeof COMMERCIAL_MODE_IDS)[number];

export type CommercialModeDefinition = {
  id: CommercialModeId;
  labelRu: string;
  /** True when this mode is part of the current production business model. */
  productionEnabled: boolean;
  /** Revenue may be counted only with verified ledger / partner proof. */
  revenueClass: "own_revenue" | "partner_commission" | "unverified_partner_value" | "none";
  notes: string;
};

/**
 * Canonical production commercial model (Sprint 5).
 * Own online payment is intentionally not enabled — partner handoff + own leads are.
 */
export const PRODUCTION_COMMERCIAL_MODES: Record<CommercialModeId, CommercialModeDefinition> =
  Object.freeze({
    own_lead: {
      id: "own_lead",
      labelRu: "Собственная заявка",
      productionEnabled: true,
      revenueClass: "none",
      notes: "Contact / enquiry / newsletter → CRM. Lead ≠ sale.",
    },
    partner_redirect: {
      id: "partner_redirect",
      labelRu: "Передача партнёру",
      productionEnabled: true,
      revenueClass: "unverified_partner_value",
      notes: "Tripster / Sputnik8 / YouTravel handoff. Handoff ≠ partner sale.",
    },
    affiliate: {
      id: "affiliate",
      labelRu: "Аффилиатный переход",
      productionEnabled: true,
      revenueClass: "partner_commission",
      notes: "Travelpayouts and affiliate fallbacks. Commission only after partner proof.",
    },
    own_booking: {
      id: "own_booking",
      labelRu: "Собственная заявка на тур",
      productionEnabled: true,
      revenueClass: "none",
      notes: "Native booking request stored in platform CRM; confirmation is a later stage.",
    },
    own_payment: {
      id: "own_payment",
      labelRu: "Собственная онлайн-оплата",
      productionEnabled: false,
      revenueClass: "own_revenue",
      notes: "Intentionally disabled until owner selects production payment provider.",
    },
  });

export function isCommercialModeEnabled(id: CommercialModeId): boolean {
  return PRODUCTION_COMMERCIAL_MODES[id].productionEnabled;
}

export function enabledCommercialModes(): CommercialModeDefinition[] {
  return COMMERCIAL_MODE_IDS.map((id) => PRODUCTION_COMMERCIAL_MODES[id]).filter(
    (mode) => mode.productionEnabled,
  );
}

export function readinessRolesForEnabledModes(): Array<
  "portal" | "affiliate" | "leads" | "booking" | "payments" | "analytics"
> {
  const roles: Array<"portal" | "affiliate" | "leads" | "booking" | "payments" | "analytics"> = [
    "portal",
    "analytics",
  ];
  if (isCommercialModeEnabled("partner_redirect") || isCommercialModeEnabled("affiliate")) {
    roles.push("affiliate");
  }
  if (isCommercialModeEnabled("own_lead")) {
    roles.push("leads");
  }
  if (isCommercialModeEnabled("own_booking")) {
    roles.push("booking");
  }
  if (isCommercialModeEnabled("own_payment")) {
    roles.push("payments");
  }
  return roles;
}
