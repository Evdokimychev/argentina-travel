import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("atomic organizer approval security", () => {
  it("keeps the RPC service-only, capability checked and concurrency safe", () => {
    const migration = source(
      "supabase/migrations/20260717030000_admin_identity_atomic_controls.sql",
    );

    expect(migration).toContain("profiles_active_role_granted_check");
    expect(migration).toContain("ORGANIZER_APPROVAL_REQUIRED");
    expect(migration).toContain("ADMIN_STAFF_ASSIGNMENT_REQUIRED");
    expect(migration).toContain("ADMIN_STAFF_REMOVAL_REQUIRED");
    expect(migration).toContain("public.admin_decide_organizer_application");
    expect(migration).toContain("'marketplace.moderation' = any(staff.capabilities)");
    expect(migration).toContain("for update;");
    expect(migration).toContain("and pending_application.status = 'pending'");
    expect(migration).toContain("application.status = target_status");
    expect(migration).toContain("organizer_verified_at = decision_time");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role;");
  });

  it("commits decision and audit in the RPC before notification outboxes", () => {
    const migration = source("supabase/migrations/20260717030000_admin_identity_atomic_controls.sql");
    const route = source("src/app/api/admin/organizer-applications/[id]/route.ts");
    const rpc = route.indexOf('"admin_decide_organizer_application"');
    const confirmed = route.indexOf("if (!decision.changed)");
    const notification = route.lastIndexOf("emitNotificationEvent");
    const email = route.indexOf("notifyOrganizerApplicationReview({");

    expect(route).toContain('auth.via !== "session"');
    expect(rpc).toBeGreaterThan(-1);
    expect(confirmed).toBeGreaterThan(rpc);
    expect(notification).toBeGreaterThan(confirmed);
    expect(email).toBeGreaterThan(confirmed);
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("'organizer_application.' || p_decision");
    expect(route).not.toContain("writeAdminAuditLog");
    expect(route).toContain("idempotent: true");
    expect(route).not.toContain('.from("organizer_applications")\n    .update');
  });
});
