import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const commercialFilename = "20260717034000_commercial_plans_entitlements.sql";
const commercialSql = readFileSync(join(migrationsDir, commercialFilename), "utf8");
const financeSql = readFileSync(
  join(migrationsDir, "20260717031000_finance_atomic_controls.sql"),
  "utf8"
);
const plansRoute = readFileSync(
  join(process.cwd(), "src", "app", "api", "admin", "commercial", "plans", "route.ts"),
  "utf8"
);
const subscriptionsRoute = readFileSync(
  join(
    process.cwd(),
    "src",
    "app",
    "api",
    "admin",
    "commercial",
    "subscriptions",
    "route.ts"
  ),
  "utf8"
);
const organizerAnalyticsRoute = readFileSync(
  join(process.cwd(), "src", "app", "api", "organizer", "analytics", "route.ts"),
  "utf8"
);

const commercialTables = [
  "commercial_adapters",
  "commercial_entitlement_definitions",
  "commercial_plans",
  "commercial_plan_entitlements",
  "organizer_commercial_subscriptions",
  "organizer_entitlement_overrides",
];

describe("commercial plan database contract", () => {
  it("uses the sole authorized migration timestamp", () => {
    const matching = readdirSync(migrationsDir).filter((name) =>
      name.includes("commercial_plans_entitlements")
    );
    expect(matching).toEqual([commercialFilename]);
  });

  it("keeps all commercial tables service-only with RLS enabled", () => {
    for (const table of commercialTables) {
      expect(commercialSql).toContain(
        `alter table public.${table} enable row level security;`
      );
      expect(commercialSql).toContain(
        `revoke all on table public.${table} from anon, authenticated;`
      );
      expect(commercialSql).toContain(`grant all on table public.${table} to service_role;`);
    }
  });

  it("protects mutations with CAS and transaction-local audit records", () => {
    expect(commercialSql).toContain("row_version = p_expected_version");
    expect(commercialSql).toContain("SUBSCRIPTION_VERSION_CONFLICT");
    expect(commercialSql).toContain("OVERRIDE_VERSION_CONFLICT");
    expect(commercialSql.match(/insert into public\.admin_audit_log/g)?.length).toBe(8);
    expect(commercialSql.match(/security invoker/g)?.length).toBe(8);
    expect(commercialSql).not.toMatch(/\b(http|net\.http|pg_net|stripe)\b/i);
  });

  it("registers hotels for the future but blocks every enable path", () => {
    expect(commercialSql).toContain(
      "('module', 'hotels', 'Отели', 'Зарезервировано для будущей разработки', 'future_disabled')"
    );
    expect(commercialSql).toContain(
      "('product', 'hotel', 'Отель', 'Только будущий контракт', 'future_disabled')"
    );
    expect(commercialSql.match(/FUTURE_DISABLED_ENTITLEMENT/g)?.length).toBe(2);

    const grantsStart = commercialSql.indexOf("with grants(");
    const grantsSection = commercialSql.slice(
      grantsStart,
      commercialSql.indexOf("create or replace function", grantsStart)
    );
    expect(grantsSection).not.toContain("module.hotels.manage");
  });

  it("has covering indexes for all new finance and commercial foreign keys", () => {
    const financeIndexes = [
      "payment_refund_source_idx",
      "payment_refund_requested_by_idx",
      "payment_refund_approved_by_idx",
      "payment_refund_claimed_by_idx",
      "payout_records_created_by_idx",
      "payout_records_approved_by_idx",
      "payout_records_exported_by_idx",
      "payout_records_completed_by_idx",
      "payout_records_cancelled_by_idx",
    ];
    const commercialIndexes = [
      "commercial_entitlement_adapter_idx",
      "commercial_plans_activated_by_idx",
      "commercial_plans_created_by_idx",
      "commercial_plans_updated_by_idx",
      "commercial_plan_entitlements_key_idx",
      "organizer_commercial_subscription_active_idx",
      "organizer_commercial_subscription_plan_idx",
      "organizer_commercial_subscription_assigned_by_idx",
      "organizer_commercial_subscription_cancelled_by_idx",
      "organizer_entitlement_override_active_idx",
      "organizer_entitlement_override_key_idx",
      "organizer_entitlement_override_updated_by_idx",
    ];

    for (const index of financeIndexes) expect(financeSql).toContain(index);
    for (const index of commercialIndexes) expect(commercialSql).toContain(index);
  });

  it("keeps admin writes capability-gated, personal and field-allowlisted", () => {
    expect(plansRoute).toContain('authorizeAdminRequest(request, "system.settings")');
    expect(subscriptionsRoute).toContain('authorizeAdminRequest(request, "users.manage")');
    expect(plansRoute).toContain('auth.via !== "session"');
    expect(subscriptionsRoute).toContain('auth.via !== "session"');
    expect(plansRoute).toContain("ALLOWED_CREATE_FIELDS");
    expect(subscriptionsRoute).toContain("ACTION_FIELDS");
    expect(`${plansRoute}\n${subscriptionsRoute}`).not.toMatch(
      /apiKey|clientSecret|accessToken|password/i
    );
  });

  it("applies the shared commercial guard to organizer analytics and export", () => {
    expect(organizerAnalyticsRoute).toContain("resolveOrganizerCommercialContract");
    expect(organizerAnalyticsRoute).toContain('"analytics.basic"');
    expect(organizerAnalyticsRoute).toContain('"analytics.advanced"');
    expect(organizerAnalyticsRoute).toContain('"analytics.export"');
    expect(organizerAnalyticsRoute.indexOf('"analytics.basic"')).toBeLessThan(
      organizerAnalyticsRoute.indexOf("getOrganizerAnalyticsServerReport(", 500)
    );
  });
});
