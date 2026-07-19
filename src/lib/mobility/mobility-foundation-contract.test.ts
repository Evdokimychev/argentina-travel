import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260717041000_mobility_native_foundation.sql",
  "utf8",
);

describe("native mobility database foundation", () => {
  it("keeps market, currency, timezone and provider ownership explicit", () => {
    for (const token of [
      "market_id text not null",
      "country_code text not null",
      "source_currency text not null",
      "display_currency text not null",
      "pickup_timezone text not null",
      "dropoff_timezone text not null",
      "source_ownership text not null",
      "capability_mode text not null",
    ]) expect(migration).toContain(token);
    expect(migration).toContain("unique (market_id, slug)");
    expect(migration).not.toContain("default 'ar'");
  });

  it("models shared fleet and separate rental versus transfer policies", () => {
    for (const table of [
      "mobility_providers",
      "mobility_provider_markets",
      "mobility_fleets",
      "mobility_vehicles",
      "mobility_rental_offers",
      "mobility_transfer_services",
      "mobility_vehicle_allocations",
    ]) expect(migration).toContain(`create table public.${table}`);
    expect(migration).toContain("mileage_policy text not null");
    expect(migration).toContain("deposit_minor bigint not null");
    expect(migration).toContain("insurance_summary text not null");
    expect(migration).toContain("meeting_policy text not null");
    expect(migration).toContain("flight_delay_policy text not null");
    expect(migration).toContain("no_show_policy text not null");
  });

  it("blocks overlapping confirmed or blocked vehicle allocations", () => {
    expect(migration).toContain("mobility_vehicle_allocation_no_overlap exclude using gist");
    expect(migration).toContain("allocation_interval with &&");
    expect(migration).toContain("where (status in ('confirmed', 'blocked'))");
  });

  it("uses idempotent native requests and PII-free analytics", () => {
    expect(migration).toContain("idempotency_key_hash text not null");
    expect(migration).toContain("request_fingerprint text not null");
    expect(migration).toContain("unique (provider_id, idempotency_key_hash)");
    expect(migration).toContain("MOBILITY_IDEMPOTENCY_CONFLICT");
    expect(migration).toContain("create table public.mobility_request_private");
    const analytics = migration.slice(
      migration.indexOf("create table public.mobility_analytics_events"),
      migration.indexOf("-- All access is server-mediated"),
    );
    expect(analytics).not.toMatch(/email|phone|contact_name|exact_address|customer_note/);
  });

  it("keeps LocalRent and Intui as independent affiliate handoffs", () => {
    expect(migration).toContain("('partner:localrent', 'rental', '/car-rental')");
    expect(migration).toContain("('partner:intui', 'transfer', '/transfers')");
    expect(migration).toContain("provider_kind = 'affiliate_partner' and capability_mode = 'affiliate_handoff'");
    expect(migration).toContain("PARTNER_PROVIDER_IMMUTABLE");
  });

  it("is server-only, CAS protected and atomically audited", () => {
    expect(migration.match(/enable row level security/g)?.length).toBeGreaterThan(0);
    expect(migration).toContain("revoke all on table public.%I from public, anon, authenticated");
    expect(migration).toContain("current_version <> p_expected_version");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("insert into public.moderation_queue");
  });
});
