import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260717036000_moderation_enqueue_triggers.sql"),
  "utf8",
);

describe("atomic moderation enqueue", () => {
  it("uses trigger-only private functions with empty search paths", () => {
    expect(migration.match(/security definer/g)?.length).toBe(3);
    expect(migration.match(/set search_path = ''/g)?.length).toBe(4);
    expect(migration.match(/from public, anon, authenticated, service_role/g)?.length).toBe(4);
    expect(migration).toContain("private.safe_uuid(new.owner_user_id)");
    expect(migration).toContain("tours_enqueue_moderation");
    expect(migration).toContain("tourist_reviews_enqueue_moderation");
    expect(migration).toContain("review_reports_enqueue_moderation");
  });

  it("keeps admin reads free of queue repair writes", () => {
    const operations = fs.readFileSync(path.join(root, "src/lib/admin/operations-server.ts"), "utf8");
    const notifications = fs.readFileSync(path.join(root, "src/lib/admin/notifications-server.ts"), "utf8");
    expect(operations).not.toContain("syncPendingToursToQueue");
    expect(operations).not.toContain("syncPendingReviewsToQueue");
    expect(notifications).not.toContain("syncPendingToursToQueue");
    expect(notifications).not.toContain("syncPendingReviewsToQueue");
  });

  it("does not copy free-form complaint details into the queue", () => {
    const reportFunction = migration.slice(migration.indexOf("private.enqueue_review_report_moderation"));
    expect(reportFunction).not.toContain("new.details");
  });
});
