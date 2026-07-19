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
    const moderationMigration = fs.readFileSync(
      path.join(
        root,
        "supabase/migrations/20260717050000_general_moderation_atomic_workflow.sql",
      ),
      "utf8",
    );

    expect(submitRoute).toContain("submittedRevisionId: submittedRevision.id");
    expect(moderationMigration).toContain("queue_hint.metadata->>'submittedRevisionId'");
    expect(moderationMigration).toContain("and document_id = document_row.id for update");
    expect(moderationMigration).toContain("p_operation => case when p_action = 'approve' then 'restore_publish'");
    expect(moderationMigration.indexOf("public.cms_mutate_document_atomic")).toBeLessThan(
      moderationMigration.indexOf("update public.moderation_queue", moderationMigration.indexOf("public.cms_mutate_document_atomic")),
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
