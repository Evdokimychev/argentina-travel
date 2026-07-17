import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  guardOrganizerEntitlement,
  resolveCommercialSnapshot,
  type CommercialResolverSnapshot,
} from "@/lib/commercial/entitlement-resolver-server";
import type { OrganizerCommercialContract } from "@/types/commercial-entitlements";

const generatedAt = "2026-07-17T12:00:00.000Z";

function baseSnapshot(): CommercialResolverSnapshot {
  return {
    organizerUserId: "00000000-0000-4000-8000-000000000001",
    generatedAt,
    adapters: [
      {
        id: "00000000-0000-4000-8000-000000000010",
        type: "module",
        code: "cars",
        label: "Автомобили",
        description: null,
        status: "active",
      },
      {
        id: "00000000-0000-4000-8000-000000000011",
        type: "module",
        code: "hotels",
        label: "Отели",
        description: null,
        status: "future_disabled",
      },
    ],
    definitions: [
      {
        key: "module.cars.manage",
        label: "Управление автомобилями",
        description: null,
        valueType: "boolean",
        adapterId: "00000000-0000-4000-8000-000000000010",
        defaultEnabled: false,
        defaultLimit: null,
        hardLimit: null,
        isActive: true,
      },
      {
        key: "module.hotels.manage",
        label: "Управление отелями",
        description: null,
        valueType: "boolean",
        adapterId: "00000000-0000-4000-8000-000000000011",
        defaultEnabled: false,
        defaultLimit: null,
        hardLimit: null,
        isActive: true,
      },
      {
        key: "limits.active_offers",
        label: "Активные предложения",
        description: null,
        valueType: "limit",
        adapterId: null,
        defaultEnabled: false,
        defaultLimit: 0,
        hardLimit: 10_000,
        isActive: true,
      },
    ],
    plan: {
      id: "00000000-0000-4000-8000-000000000020",
      code: "pro",
      version: 3,
      name: "Профи",
      description: null,
      status: "active",
      is_default: true,
      price_minor: 9900,
      currency: "USD",
      billing_period: "monthly",
      row_version: 7,
      activated_at: generatedAt,
      activated_by: null,
      created_by: null,
      updated_by: null,
      created_at: generatedAt,
      updated_at: generatedAt,
    },
    subscription: null,
    grants: [
      { entitlement_key: "module.cars.manage", enabled: true, limit_value: null },
      { entitlement_key: "module.hotels.manage", enabled: true, limit_value: null },
      { entitlement_key: "limits.active_offers", enabled: true, limit_value: 100 },
    ],
    overrides: [],
  };
}

describe("commercial entitlement resolver", () => {
  it("combines plan grants and a per-organizer override", () => {
    const snapshot = baseSnapshot();
    snapshot.overrides.push({
      id: "00000000-0000-4000-8000-000000000030",
      organizer_user_id: snapshot.organizerUserId,
      entitlement_key: "limits.active_offers",
      enabled: true,
      limit_value: 250,
      reason: "Индивидуальный договор",
      starts_at: generatedAt,
      ends_at: null,
      row_version: 2,
      updated_by: null,
      created_at: generatedAt,
      updated_at: generatedAt,
    });

    const contract = resolveCommercialSnapshot(snapshot);

    expect(contract.plan?.code).toBe("pro");
    expect(contract.entitlements["module.cars.manage"]?.enabled).toBe(true);
    expect(contract.entitlements["limits.active_offers"]).toMatchObject({
      enabled: true,
      limit: 250,
      source: "override",
    });
  });

  it("hard-disables a future adapter even if a plan grant is enabled", () => {
    const contract = resolveCommercialSnapshot(baseSnapshot());

    expect(contract.entitlements["module.hotels.manage"]).toMatchObject({
      enabled: false,
      source: "future_disabled",
    });
    expect(contract.adapters["module.hotels"]).toMatchObject({
      allowed: false,
      status: "future_disabled",
    });
  });

  it("enforces numeric limits at the common guard", () => {
    const contract = resolveCommercialSnapshot(baseSnapshot());

    expect(guardOrganizerEntitlement(contract, "limits.active_offers", 99).allowed).toBe(
      true
    );
    expect(guardOrganizerEntitlement(contract, "limits.active_offers", 100)).toMatchObject({
      allowed: false,
      reason: "limit_reached",
    });
  });

  it("fails closed when the commercial contract is unavailable", () => {
    const unavailable: OrganizerCommercialContract = {
      ok: false,
      organizerUserId: "00000000-0000-4000-8000-000000000001",
      plan: null,
      subscription: null,
      entitlements: {},
      adapters: {},
      generatedAt,
      denialReason: "settings_unavailable",
    };

    expect(guardOrganizerEntitlement(unavailable, "analytics.basic")).toEqual({
      allowed: false,
      reason: "contract_unavailable",
      decision: null,
    });
  });
});
