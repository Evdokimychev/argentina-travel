export const COMMERCIAL_ADAPTER_TYPES = ["module", "product", "provider", "market"] as const;
export type CommercialAdapterType = (typeof COMMERCIAL_ADAPTER_TYPES)[number];

export type CommercialAdapterStatus = "active" | "future_disabled" | "retired";
export type CommercialPlanStatus = "draft" | "active" | "retired";
export type CommercialBillingPeriod = "none" | "monthly" | "yearly";
export type CommercialEntitlementValueType = "boolean" | "limit";

export const COMMERCIAL_ENTITLEMENT_KEYS = [
  "analytics.basic",
  "analytics.advanced",
  "analytics.export",
  "module.tours.manage",
  "module.excursions.manage",
  "module.apartments.manage",
  "module.cars.manage",
  "module.transfers.manage",
  "module.hotels.manage",
  "provider.localrent.access",
  "provider.intui.access",
  "market.ar.publish",
  "limits.active_offers",
  "limits.team_members",
] as const;

export type CommercialEntitlementKey = (typeof COMMERCIAL_ENTITLEMENT_KEYS)[number];

export type CommercialAdapter = {
  id: string;
  type: CommercialAdapterType;
  code: string;
  label: string;
  description: string | null;
  status: CommercialAdapterStatus;
};

export type CommercialEntitlementDefinition = {
  key: string;
  label: string;
  description: string | null;
  valueType: CommercialEntitlementValueType;
  adapterId: string | null;
  defaultEnabled: boolean;
  defaultLimit: number | null;
  hardLimit: number | null;
  isActive: boolean;
};

export type CommercialPlanSummary = {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string | null;
  status: CommercialPlanStatus;
  isDefault: boolean;
  priceMinor: number | null;
  currency: "USD" | "RUB" | "ARS" | "EUR";
  billingPeriod: CommercialBillingPeriod;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type CommercialEntitlementDecision = {
  key: string;
  enabled: boolean;
  limit: number | null;
  source: "plan" | "override" | "definition_default" | "future_disabled" | "unavailable";
  reason: string;
  adapter: Pick<CommercialAdapter, "type" | "code" | "status"> | null;
};

export type OrganizerCommercialContract = {
  ok: boolean;
  organizerUserId: string;
  plan: CommercialPlanSummary | null;
  subscription: {
    id: string;
    rowVersion: number;
    source: "subscription" | "default_plan";
    startsAt: string;
    endsAt: string | null;
  } | null;
  entitlements: Record<string, CommercialEntitlementDecision>;
  adapters: Record<string, { allowed: boolean; status: CommercialAdapterStatus; reason: string }>;
  generatedAt: string;
  denialReason?: "settings_unavailable" | "plan_unavailable" | "ambiguous_subscription";
};

export type EntitlementGuardResult =
  | { allowed: true; decision: CommercialEntitlementDecision }
  | {
      allowed: false;
      reason: "contract_unavailable" | "not_entitled" | "limit_reached";
      decision: CommercialEntitlementDecision | null;
    };
