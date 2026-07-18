import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { resolveBlogCommentReportModeration } from "@/lib/blog-comments-server";
import type { Database } from "@/types/database";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const migration = source(
  "supabase/migrations/20260717033000_blog_comment_moderation.sql",
).toLowerCase();

describe("blog comment complaint moderation", () => {
  it("enqueues complaints atomically and keeps the admin GET path read-only", () => {
    const moderationServer = source("src/lib/admin/moderation-server.ts");
    const queueReader = moderationServer.slice(
      moderationServer.indexOf("export async function fetchModerationQueue"),
      moderationServer.indexOf("export async function resolveModerationItem"),
    );

    expect(migration).toContain("after insert on public.blog_comment_reports");
    expect(migration).toContain("insert into public.moderation_queue");
    expect(migration).toContain("where report.status = 'pending'");
    expect(queueReader).toContain("fetchBlogCommentReportModerationSummaries");
    expect(queueReader).not.toContain("syncPendingToursToQueue");
    expect(queueReader).not.toContain("syncPendingReviewsToQueue");
  });

  it("uses fixed search paths and exposes the resolver only to service_role", () => {
    expect(migration).toContain("security definer\nset search_path = ''");
    expect(migration).toContain("security invoker\nset search_path = ''");
    expect(migration).toContain(
      "from public, anon, authenticated;\ngrant execute on function public.admin_resolve_blog_comment_report",
    );
    expect(migration).toContain("to service_role;");
    expect(migration).toContain("'marketplace.moderation' = any(staff.capabilities)");
  });

  it("locks in one order, compares expected state, audits atomically and records reversal context", () => {
    const queueLock = migration.indexOf("from public.moderation_queue");
    const reportLock = migration.indexOf("from public.blog_comment_reports", queueLock);
    const commentLock = migration.indexOf("from public.blog_article_comments", reportLock);

    expect(queueLock).toBeGreaterThan(-1);
    expect(reportLock).toBeGreaterThan(queueLock);
    expect(commentLock).toBeGreaterThan(reportLock);
    expect(migration.match(/for update;/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("'code', 'version_conflict'");
    expect(migration).toContain("queue_row.status <> p_expected_queue_status");
    expect(migration).toContain("report_row.status <> p_expected_report_status");
    expect(migration).toContain("comment_row.status <> p_expected_comment_status");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("'previouscommentstatus', comment_row.status");
    expect(migration).toContain("'nextcommentstatus', next_comment_status");
    expect(migration).toContain("queue_row.status = 'approved' and report_row.status = 'resolved'");
    expect(migration).toContain("when p_action = 'restore_comment' then 'published'");
  });

  it("prevents comment authors from restoring a hidden comment through RLS", () => {
    expect(migration).toContain('drop policy if exists "blog_article_comments_update_author"');
    expect(migration).toContain("and status in ('pending', 'published')");
    expect(migration).not.toContain("status in ('pending', 'published', 'hidden')");
  });

  it("sends expected-state CAS fields and maps a concurrent change for the admin", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ok: false,
        code: "version_conflict",
        actualQueueStatus: "approved",
        actualReportStatus: "resolved",
        actualCommentStatus: "hidden",
      },
      error: null,
    });
    const supabase = { rpc } as unknown as SupabaseClient<Database>;

    const result = await resolveBlogCommentReportModeration(supabase, {
      queueId: "11111111-1111-4111-8111-111111111111",
      reportId: "22222222-2222-4222-8222-222222222222",
      actorUserId: "33333333-3333-4333-8333-333333333333",
      action: "hide_comment",
      expectedQueueStatus: "pending",
      expectedReportStatus: "pending",
      expectedCommentStatus: "published",
      note: "  подтверждено  ",
      ipAddress: " 127.0.0.1 ",
    });

    expect(rpc).toHaveBeenCalledWith("admin_resolve_blog_comment_report", {
      p_queue_id: "11111111-1111-4111-8111-111111111111",
      p_report_id: "22222222-2222-4222-8222-222222222222",
      p_actor_id: "33333333-3333-4333-8333-333333333333",
      p_action: "hide_comment",
      p_expected_queue_status: "pending",
      p_expected_report_status: "pending",
      p_expected_comment_status: "published",
      p_note: "подтверждено",
      p_ip_address: "127.0.0.1",
    });
    expect(result).toMatchObject({
      code: "version_conflict",
      actualQueueStatus: "approved",
      actualReportStatus: "resolved",
      actualCommentStatus: "hidden",
    });
  });

  it("returns HTTP 409 for a stale moderation screen", () => {
    const route = source("src/app/api/admin/moderation/[id]/route.ts");
    const view = source("src/components/admin/views/ModerationView.tsx");

    expect(route).toContain('result.code === "version_conflict"');
    expect(route).toContain("? 409");
    expect(view).toContain("expectedQueueStatus: item.status");
    expect(view).toContain("expectedReportStatus: item.blogCommentReport?.reportStatus");
    expect(view).toContain("expectedCommentStatus: item.blogCommentReport?.commentStatus");
    expect(view).toContain("if (res.status === 409) await refresh()");
  });
});
