import type {
  CommercialAdapterStatus,
  CommercialAdapterType,
  CommercialEntitlementKey,
  CommercialEntitlementValueType,
} from "@/types/commercial-entitlements";

export type CommercialEntitlementCatalogEntry = {
  key: CommercialEntitlementKey;
  valueType: CommercialEntitlementValueType;
  adapter?: { type: CommercialAdapterType; code: string; status: CommercialAdapterStatus };
};

export const COMMERCIAL_ENTITLEMENT_CATALOG: readonly CommercialEntitlementCatalogEntry[] = [
  { key: "analytics.basic", valueType: "boolean" },
  { key: "analytics.advanced", valueType: "boolean" },
  { key: "analytics.export", valueType: "boolean" },
  { key: "module.tours.manage", valueType: "boolean", adapter: { type: "module", code: "tours", status: "active" } },
  { key: "module.excursions.manage", valueType: "boolean", adapter: { type: "module", code: "excursions", status: "active" } },
  { key: "module.apartments.manage", valueType: "boolean", adapter: { type: "module", code: "apartments", status: "active" } },
  { key: "module.cars.manage", valueType: "boolean", adapter: { type: "module", code: "cars", status: "active" } },
  { key: "module.transfers.manage", valueType: "boolean", adapter: { type: "module", code: "transfers", status: "active" } },
  { key: "module.hotels.manage", valueType: "boolean", adapter: { type: "module", code: "hotels", status: "future_disabled" } },
  { key: "provider.localrent.access", valueType: "boolean", adapter: { type: "provider", code: "localrent", status: "active" } },
  { key: "provider.intui.access", valueType: "boolean", adapter: { type: "provider", code: "intui", status: "active" } },
  { key: "market.ar.publish", valueType: "boolean", adapter: { type: "market", code: "ar", status: "active" } },
  { key: "limits.active_offers", valueType: "limit" },
  { key: "limits.team_members", valueType: "limit" },
] as const;

const KNOWN_ENTITLEMENT_KEYS = new Set<string>(
  COMMERCIAL_ENTITLEMENT_CATALOG.map((entry) => entry.key)
);

export function isCommercialEntitlementKey(value: unknown): value is CommercialEntitlementKey {
  return typeof value === "string" && KNOWN_ENTITLEMENT_KEYS.has(value);
}

export const RESERVED_FUTURE_ENTITLEMENTS = new Set<CommercialEntitlementKey>([
  "module.hotels.manage",
]);
