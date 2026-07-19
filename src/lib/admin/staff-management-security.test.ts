import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertStaffTargetMutationAllowed,
  hasConsistentOwnerGrant,
  isConfirmedActiveOwner,
  parseAdminCapabilities,
  type StaffSecurityRecord,
} from "@/lib/admin/staff-management";

const owner: StaffSecurityRecord = {
  userId: "owner-a",
  preset: "super_admin",
  capabilities: ["*"],
  isActive: true,
};

describe("admin staff management security", () => {
  it("requires an active super_admin row with an explicit wildcard", () => {
    expect(isConfirmedActiveOwner(owner)).toBe(true);
    expect(isConfirmedActiveOwner({ ...owner, isActive: false })).toBe(false);
    expect(isConfirmedActiveOwner({ ...owner, preset: "support_agent" })).toBe(false);
    expect(isConfirmedActiveOwner({ ...owner, capabilities: [] })).toBe(false);
  });

  it("rejects self-mutation and protects every confirmed owner row", () => {
    expect(assertStaffTargetMutationAllowed({ actorId: owner.userId, target: owner })).toMatchObject({
      ok: false,
      code: "SELF_STAFF_MUTATION_FORBIDDEN",
    });
    expect(
      assertStaffTargetMutationAllowed({ actorId: "owner-b", target: owner }),
    ).toMatchObject({ ok: false, code: "OWNER_STAFF_MUTATION_FORBIDDEN" });
  });

  it("accepts only known capabilities and consistent owner grants", () => {
    expect(parseAdminCapabilities(["users.view", "users.view"])).toEqual({
      ok: true,
      capabilities: ["users.view"],
    });
    expect(parseAdminCapabilities(["root.shell"])).toMatchObject({ ok: false });
    expect(hasConsistentOwnerGrant(owner)).toBe(true);
    expect(hasConsistentOwnerGrant({ ...owner, capabilities: [] })).toBe(false);
    expect(
      hasConsistentOwnerGrant({ ...owner, preset: "support_agent", capabilities: ["*"] }),
    ).toBe(false);
  });

  it("keeps mutations behind the owner guard and audits removal", () => {
    const collectionRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/staff/route.ts"),
      "utf8",
    );
    expect(collectionRoute).toContain('authorizeAdminRequest(request, "users.manage")');
    expect(collectionRoute).toContain("authorizeStaffManagementRequest");
    expect(collectionRoute).toContain("assertStaffTargetMutationAllowed");
    const staffInsert = collectionRoute.indexOf('.from("admin_staff").insert');
    const profileRoleUpdate = collectionRoute.indexOf('.from("profiles")\n      .update');
    expect(staffInsert).toBeGreaterThan(-1);
    expect(profileRoleUpdate).toBeGreaterThan(staffInsert);
    expect(collectionRoute).toContain('.from("admin_staff").delete().eq("user_id", userId)');

    const itemRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/staff/[userId]/route.ts"),
      "utf8",
    );
    expect(itemRoute).toContain("authorizeStaffManagementRequest");
    expect(itemRoute).toContain("assertStaffTargetMutationAllowed");
    expect(itemRoute).toContain('action: "staff.remove"');

    const guard = fs.readFileSync(
      path.join(process.cwd(), "src/lib/admin/staff-management.ts"),
      "utf8",
    );
    expect(guard).toContain('auth.via !== "session"');
    expect(guard).toContain("isConfirmedActiveOwner(owner)");
  });
});
