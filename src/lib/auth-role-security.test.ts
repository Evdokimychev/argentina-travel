import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("auth role hardening", () => {
  it("forces a safe base role in the latest signup trigger", () => {
    const sql = fs.readFileSync(
      path.join(root, "supabase/migrations/20260715032401_secure_auth_role_bootstrap.sql"),
      "utf8",
    );
    const triggerBody = sql.slice(
      sql.indexOf("create or replace function public.handle_new_user"),
      sql.indexOf("create or replace function public.is_admin_with"),
    );
    expect(triggerBody).toContain("array['tourist']::text[]");
    expect(triggerBody).not.toContain("meta->>'role'");
  });

  it("does not grant capabilities when an admin_staff row is missing", () => {
    const source = fs.readFileSync(path.join(root, "src/lib/admin/staff.ts"), "utf8");
    expect(source).not.toContain("bootstrapRecord");
    expect(source).not.toContain("BOOTSTRAP_CAPABILITIES");
  });
});
