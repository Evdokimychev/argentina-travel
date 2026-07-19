import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("expert moderation audit trail", () => {
  it("records expert edits, moderation actions and inquiry status changes", () => {
    const detailRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/experts/[id]/route.ts"),
      "utf8",
    );
    const collectionRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/experts/route.ts"),
      "utf8",
    );

    expect(detailRoute).toContain("writeAdminAuditLog");
    expect(detailRoute).toContain('action: "expert.update"');
    expect(collectionRoute).toContain('action: "expert_inquiry.status_update"');
    expect(collectionRoute).toContain("action: `expert.${body.action}`");
    expect(collectionRoute).toContain("previousStatus: expert.status");
  });
});
