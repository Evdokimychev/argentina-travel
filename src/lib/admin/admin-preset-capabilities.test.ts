import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin preset capability migration", () => {
  it("includes preset and explicit capabilities in the database guard", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260715123000_fix_admin_preset_capabilities.sql"),
      "utf8"
    );

    expect(sql).toContain("left join public.admin_role_presets");
    expect(sql).toContain("coalesce(s.capabilities");
    expect(sql).toContain("coalesce(r.capabilities");
    expect(sql).toContain("s.is_active = true");
  });
});
