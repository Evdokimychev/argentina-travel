import { describe, expect, it } from "vitest";
import { CRITICAL_AUDIT_ACTIONS } from "@/lib/admin/audit";

describe("critical audit contract", () => {
  it("keeps a non-empty critical action allowlist", () => {
    expect(CRITICAL_AUDIT_ACTIONS.has("users.block")).toBe(true);
    expect(CRITICAL_AUDIT_ACTIONS.has("finance.refund.approve")).toBe(true);
    expect(CRITICAL_AUDIT_ACTIONS.has("privacy.delete")).toBe(true);
  });
});
