import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("author article moderation security", () => {
  it("pins a revision at submit and publishes only that revision", () => {
    const submitRoute = fs.readFileSync(
      path.join(root, "src/app/api/organizer/articles/[id]/submit/route.ts"),
      "utf8",
    );
    const moderationServer = fs.readFileSync(
      path.join(root, "src/lib/admin/moderation-server.ts"),
      "utf8",
    );

    expect(submitRoute).toContain("submittedRevisionId: submittedRevision.id");
    expect(moderationServer).toContain('metadataString(item.metadata, "submittedRevisionId")');
    expect(moderationServer).toContain("getCmsRevisionById");
    expect(moderationServer).toContain("title: revision.title");
    expect(moderationServer.indexOf("updateCmsDocument")).toBeLessThan(
      moderationServer.indexOf('status: resolvedStatus'),
    );
  });

  it("requires publish capability for approving author articles", () => {
    const route = fs.readFileSync(
      path.join(root, "src/app/api/admin/moderation/[id]/route.ts"),
      "utf8",
    );

    expect(route).toContain('queueItem?.entity_type === "author_article"');
    expect(route).toContain('authorizeAdminRequest(request, "content.publish")');
  });
});
