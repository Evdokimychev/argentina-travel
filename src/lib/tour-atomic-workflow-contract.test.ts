import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260717049000_tour_entitlement_atomic_workflow.sql"),
  "utf8"
);
const route = fs.readFileSync(
  path.join(root, "src/app/api/organizer/tours/[id]/draft/route.ts"),
  "utf8"
);
const client = fs.readFileSync(
  path.join(root, "src/lib/organizer-tour-draft-api.ts"),
  "utf8"
);
const adminRoute = fs.readFileSync(
  path.join(root, "src/app/api/admin/tours/[id]/route.ts"),
  "utf8"
);
const adminList = fs.readFileSync(
  path.join(root, "src/lib/tour-content-server.ts"),
  "utf8"
);

describe("atomic organizer tour workflow", () => {
  it("uses one CAS mutation for save, submit and archive", () => {
    expect(migration).toContain("add column if not exists row_version integer not null default 1");
    expect(migration).toContain("p_operation not in ('save', 'submit', 'archive')");
    expect(migration).toContain("where id = p_tour_id and row_version = p_expected_version");
    expect(migration).toContain("row_version = row_version + 1");
    expect(migration).toContain("'organizer.tour_' || p_operation");
    expect(route).toContain('"organizer_mutate_tour_atomic"');
    expect(migration).toContain("admin_unpublish_tour_atomic");
    expect(migration).toContain("marketplace.moderation");
    expect(adminRoute).toContain('authorizeAdminRequest(request, "marketplace.moderation")');
    expect(adminRoute).toContain('auth.via !== "session"');
  });

  it("enforces reusable module, market and shared active-offer capabilities", () => {
    expect(migration).toContain("module.excursions.manage");
    expect(migration).toContain("module.tours.manage");
    expect(migration).toContain("'market.' || p_market_code || '.publish'");
    expect(migration).toContain("limits.active_offers");
    expect(migration).toContain("private.organizer_active_offer_usage");
    expect(migration).toContain("private.enforce_shared_active_offer_limit");
    expect(migration).toContain("apartment_shared_active_offer_limit");
    expect(migration).toContain("mobility_rental_shared_active_offer_limit");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("public.apartment_listings");
    expect(migration).toContain("public.mobility_rental_offers");
    expect(migration).toContain("public.mobility_transfer_services");
  });

  it("fails closed without exposing a force-write bypass", () => {
    expect(route).not.toMatch(/\bforce\b/);
    expect(client).not.toMatch(/\bforce\b/);
    expect(route).toContain("Не удалось безопасно проверить возможности тарифа");
    expect(route).not.toContain("mutationError.message }, { status: 500");
  });

  it("keeps privileged mutation service-only and queues submission transactionally", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(") from public, anon, authenticated;");
    expect(migration).toContain(") to service_role;");
    expect(migration).toContain("moderation_status = case when p_operation = 'submit' then 'pending'");
    expect(migration).toContain("update public.moderation_queue");
  });

  it("gives the owner paginated withdrawal controls without a content-edit bypass", () => {
    expect(adminList).toContain('.select("*", { count: "exact" })');
    expect(adminList).toContain(".range(offset, offset + limit - 1)");
    expect(adminList).not.toContain(".limit(500)");
    expect(adminRoute).toContain('p_action: action');
    expect(adminRoute).not.toContain('.from("tours").update');
  });
});
