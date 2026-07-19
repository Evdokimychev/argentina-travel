import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  guardUserIdentityTarget,
  isUuid,
  parseUserIdentityPatch,
} from "@/lib/admin/user-identity-management";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("admin user identity controls", () => {
  it("validates UUIDs and accepts only ordinary account roles", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isUuid("service-role")).toBe(false);

    expect(
      parseUserIdentityPatch({
        roles: ["tourist", "organizer", "organizer"],
        activeRole: "organizer",
        isBlocked: false,
      }),
    ).toEqual({
      ok: true,
      value: {
        roles: ["tourist", "organizer"],
        activeRole: "organizer",
        isBlocked: false,
      },
    });
    expect(parseUserIdentityPatch({ roles: ["admin"] })).toMatchObject({
      ok: false,
      code: "ROLE_NOT_MANAGEABLE",
    });
    expect(parseUserIdentityPatch({ roles: ["owner"] })).toMatchObject({ ok: false });
    expect(parseUserIdentityPatch({ activeRole: "admin" })).toMatchObject({
      ok: false,
      code: "ACTIVE_ROLE_NOT_MANAGEABLE",
    });
    expect(parseUserIdentityPatch({ roles: [] })).toMatchObject({ ok: false });
    expect(parseUserIdentityPatch({ isBlocked: "yes" })).toMatchObject({ ok: false });
    expect(parseUserIdentityPatch({ root: true })).toMatchObject({
      ok: false,
      code: "UNKNOWN_FIELD",
    });
  });

  it("prevents self mutation and keeps admin staff out of the generic users API", () => {
    expect(
      guardUserIdentityTarget({
        actorId: "same-user",
        targetId: "same-user",
        targetRoles: ["admin"],
        hasStaffAssignment: true,
        patch: { isBlocked: true },
      }),
    ).toMatchObject({ ok: false, code: "SELF_IDENTITY_MUTATION_FORBIDDEN" });

    expect(
      guardUserIdentityTarget({
        actorId: "owner",
        targetId: "staff",
        targetRoles: ["tourist"],
        hasStaffAssignment: true,
        patch: { roles: ["tourist"] },
      }),
    ).toMatchObject({ ok: false, code: "ADMIN_IDENTITY_MANAGED_IN_STAFF" });

    expect(
      guardUserIdentityTarget({
        actorId: "owner",
        targetId: "user",
        targetRoles: ["tourist"],
        hasStaffAssignment: false,
        patch: { adminNotes: "Проверено" },
      }),
    ).toEqual({ ok: true });
  });

  it("requires confirmed session/auth outcomes and an atomic profile audit", () => {
    const route = source("src/app/api/admin/users/[id]/route.ts");
    const authUpdate = route.indexOf("setAuthBlocked(supabase, id, body.isBlocked!)");
    const revokeSessions = route.indexOf("revokeSupabaseAuthSessions(id)");
    const atomicProfileUpdate = route.lastIndexOf('"admin_update_user_profile_atomic"');

    expect(route).toContain('auth.via !== "session"');
    expect(route).toContain("data.user?.id !== userId");
    expect(route).toContain('"AUTH_SESSION_REVOCATION_FAILED"');
    expect(route).toContain('"AUTH_BLOCK_COMPENSATION_FAILED"');
    expect(route).toContain("p_expected_version: current.row_version");
    expect(route).toContain("!updatedProfile");
    expect(route).not.toContain("writeAdminAuditLog");
    expect(authUpdate).toBeGreaterThan(-1);
    expect(revokeSessions).toBeGreaterThan(authUpdate);
    expect(atomicProfileUpdate).toBeGreaterThan(revokeSessions);
  });
});
