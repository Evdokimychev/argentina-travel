import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260717048000_admin_user_directory_atomic.sql", "utf8");

describe("admin user directory", () => {
  it("searches the whole directory on the server with bounded pagination", () => {
    const route = readFileSync("src/app/api/admin/users/route.ts", "utf8");
    const view = readFileSync("src/components/admin/views/UsersView.tsx", "utf8");
    expect(route).toContain("admin_search_profiles");
    expect(route).not.toContain(".limit(100)");
    expect(migration).toContain("safe_limit integer := least");
    expect(migration).toContain("strpos(lower(concat_ws");
    expect(view).toContain("offset: String(page * 50)");
    expect(view).toContain("Показано {users.length} из {total}");
  });

  it("updates profile state and audit atomically with CAS", () => {
    const route = readFileSync("src/app/api/admin/users/[id]/route.ts", "utf8");
    const update = migration.slice(migration.indexOf("create or replace function public.admin_update_user_profile_atomic"));
    expect(update).toContain("for update");
    expect(update).toContain("VERSION_CONFLICT");
    expect(update).toContain("insert into public.admin_audit_log");
    expect(update).toContain("STAFF_IDENTITY_MANAGED_SEPARATELY");
    expect(route).toContain("admin_update_user_profile_atomic");
    expect(route).not.toContain("writeAdminAuditLog");
    expect(route).not.toContain("Supabase Auth");
  });
});
