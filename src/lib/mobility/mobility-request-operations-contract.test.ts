import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260717041000_mobility_native_foundation.sql",
  "utf8",
);

describe("mobility request operations", () => {
  it("uses fingerprint-safe idempotency and only notifies on first creation", () => {
    const createRequest = migration.slice(
      migration.indexOf("create or replace function public.mobility_create_request"),
      migration.indexOf("create or replace function public.mobility_record_partner_handoff"),
    );
    expect(createRequest).toContain("request_fingerprint");
    expect(createRequest).toContain("on conflict (provider_id, idempotency_key_hash) do nothing");
    expect(createRequest).toContain("MOBILITY_IDEMPOTENCY_CONFLICT");
    expect(createRequest.indexOf("if not found then")).toBeLessThan(createRequest.indexOf("insert into public.admin_notifications"));
  });

  it("keeps request transitions CAS protected, owner-scoped and allocation-safe", () => {
    const transition = migration.slice(
      migration.indexOf("create or replace function public.mobility_transition_request"),
      migration.indexOf("create or replace function public.mobility_public_catalog"),
    );
    expect(transition).toContain("for update;");
    expect(transition).toContain("VERSION_CONFLICT");
    expect(transition).toContain("provider_owner <> p_actor_user_id");
    expect(transition).toContain("tstzrange(p_starts_at, p_ends_at, '[)')");
    expect(transition).toContain("VEHICLE_TIME_CONFLICT");
    expect(transition).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("mobility_vehicle_allocations_active_request_idx");
  });

  it("exposes PII only through authenticated operations routes", () => {
    const adminRoute = readFileSync("src/app/api/admin/mobility/requests/route.ts", "utf8");
    const organizerRoute = readFileSync("src/app/api/organizer/mobility/requests/route.ts", "utf8");
    const publicCatalog = readFileSync("src/app/api/mobility/catalog/route.ts", "utf8");
    expect(adminRoute).toContain('"operations.bookings"');
    expect(adminRoute).toContain('auth.via !== "session"');
    expect(organizerRoute).toContain("authorizeOrganizerMobility");
    expect(publicCatalog).not.toMatch(/contactEmail|contactPhone|customerNote/);
  });
});
