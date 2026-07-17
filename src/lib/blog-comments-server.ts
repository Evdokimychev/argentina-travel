import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  BLOG_COMMENT_REPORT_REASON_LABELS,
  type BlogComment,
  type BlogCommentAuthor,
  type BlogCommentReportReason,
} from "@/lib/blog-comments-types";

import { parseBlogCommentBody } from "@/lib/blog-comments-parsers";

export type { BlogComment, BlogCommentAuthor, BlogCommentReportReason };
export { BLOG_COMMENT_REPORT_REASON_LABELS };

type DbClient = SupabaseClient<Database>;

export type BlogCommentReportModerationSummary = {
  reportId: string;
  reportStatus: string;
  reason: string;
  reasonLabel: string;
  details: string | null;
  reporterName: string | null;
  createdAt: string;
  commentId: string;
  commentStatus: string;
  commentBody: string;
  commentAuthorName: string;
  commentCreatedAt: string;
  articleSlug: string;
};

export type BlogCommentReportModerationAction =
  | "hide_comment"
  | "restore_comment"
  | "dismiss_report";

export type BlogCommentReportModerationResult =
  | {
      ok: true;
      queueStatus: string;
      reportStatus: string;
      commentStatus: string;
    }
  | {
      error: string;
      code:
        | "not_found"
        | "version_conflict"
        | "invalid_transition"
        | "invalid_action"
        | "forbidden"
        | "unexpected";
      actualQueueStatus?: string;
      actualReportStatus?: string;
      actualCommentStatus?: string;
    };

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name"
>;

function mapAuthor(profile: ProfileRow | null | undefined, userId: string): BlogCommentAuthor {
  const first = profile?.first_name?.trim() ?? "";
  const last = profile?.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return {
    id: userId,
    displayName: full || "Читатель",
  };
}

async function loadAuthors(
  supabase: DbClient,
  userIds: string[],
): Promise<Map<string, ProfileRow>> {
  const ids = [...new Set(userIds)];
  if (!ids.length) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", ids);

  return new Map((data ?? []).map((row) => [row.id, row]));
}

function profileDisplayName(profile: ProfileRow | null | undefined): string | null {
  if (!profile) return null;
  const displayName = `${profile.first_name?.trim() ?? ""} ${profile.last_name?.trim() ?? ""}`.trim();
  return displayName || null;
}

export async function fetchBlogCommentReportModerationSummaries(
  supabase: DbClient,
  reportIds: string[],
): Promise<Map<string, BlogCommentReportModerationSummary>> {
  const ids = [...new Set(reportIds)];
  if (!ids.length) return new Map();

  const { data: reports, error: reportsError } = await supabase
    .from("blog_comment_reports")
    .select("id, comment_id, reporter_user_id, reason, details, status, created_at")
    .in("id", ids);
  if (reportsError || !reports?.length) return new Map();

  const { data: comments, error: commentsError } = await supabase
    .from("blog_article_comments")
    .select("id, article_slug, user_id, body, status, created_at")
    .in("id", [...new Set(reports.map((report) => report.comment_id))]);
  if (commentsError || !comments?.length) return new Map();

  const profiles = await loadAuthors(
    supabase,
    reports
      .flatMap((report) => [report.reporter_user_id])
      .concat(comments.map((comment) => comment.user_id))
      .filter((id): id is string => Boolean(id)),
  );
  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  const summaries = new Map<string, BlogCommentReportModerationSummary>();

  for (const report of reports) {
    const comment = commentsById.get(report.comment_id);
    if (!comment) continue;
    const reason = report.reason as BlogCommentReportReason;
    summaries.set(report.id, {
      reportId: report.id,
      reportStatus: report.status,
      reason: report.reason,
      reasonLabel: BLOG_COMMENT_REPORT_REASON_LABELS[reason] ?? report.reason,
      details: report.details,
      reporterName: report.reporter_user_id
        ? profileDisplayName(profiles.get(report.reporter_user_id))
        : null,
      createdAt: report.created_at,
      commentId: comment.id,
      commentStatus: comment.status,
      commentBody: comment.body,
      commentAuthorName: profileDisplayName(profiles.get(comment.user_id)) ?? "Читатель",
      commentCreatedAt: comment.created_at,
      articleSlug: comment.article_slug,
    });
  }

  return summaries;
}

export async function resolveBlogCommentReportModeration(
  supabase: DbClient,
  input: {
    queueId: string;
    reportId: string;
    actorUserId: string;
    action: BlogCommentReportModerationAction;
    expectedQueueStatus: string;
    expectedReportStatus: string;
    expectedCommentStatus: string;
    note?: string;
    ipAddress?: string | null;
  },
): Promise<BlogCommentReportModerationResult> {
  const { data, error } = await supabase.rpc("admin_resolve_blog_comment_report", {
    p_queue_id: input.queueId,
    p_report_id: input.reportId,
    p_actor_id: input.actorUserId,
    p_action: input.action,
    p_expected_queue_status: input.expectedQueueStatus,
    p_expected_report_status: input.expectedReportStatus,
    p_expected_comment_status: input.expectedCommentStatus,
    p_note: input.note?.trim() || null,
    p_ip_address: input.ipAddress?.trim() || null,
  });

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { error: error?.message ?? "Не удалось обработать жалобу", code: "unexpected" };
  }

  const result = data as Record<string, unknown>;
  if (result.ok === true) {
    return {
      ok: true,
      queueStatus: String(result.queueStatus ?? ""),
      reportStatus: String(result.reportStatus ?? ""),
      commentStatus: String(result.commentStatus ?? ""),
    };
  }

  const code =
    result.code === "not_found" ||
    result.code === "version_conflict" ||
    result.code === "invalid_transition" ||
    result.code === "invalid_action" ||
    result.code === "forbidden"
      ? result.code
      : "unexpected";
  return {
    error:
      code === "version_conflict"
        ? "Жалобу уже изменил другой администратор. Обновите очередь."
        : code === "not_found"
          ? "Жалоба или комментарий больше не найдены."
          : code === "forbidden"
            ? "Недостаточно прав для модерации жалобы."
            : code === "invalid_transition"
              ? "Состояние комментария не допускает это действие. Обновите очередь."
              : "Не удалось обработать жалобу.",
    code,
    actualQueueStatus:
      typeof result.actualQueueStatus === "string" ? result.actualQueueStatus : undefined,
    actualReportStatus:
      typeof result.actualReportStatus === "string" ? result.actualReportStatus : undefined,
    actualCommentStatus:
      typeof result.actualCommentStatus === "string" ? result.actualCommentStatus : undefined,
  };
}

export async function listBlogArticleComments(
  supabase: DbClient,
  articleSlug: string,
  viewerUserId?: string | null,
): Promise<BlogComment[]> {
  const { data, error } = await supabase
    .from("blog_article_comments")
    .select("*")
    .eq("article_slug", articleSlug)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Не удалось загрузить комментарии");
  }

  const rows = data ?? [];
  const authors = await loadAuthors(
    supabase,
    rows.map((row) => row.user_id),
  );

  return rows.map((row) => ({
    id: row.id,
    articleSlug: row.article_slug,
    body: row.body,
    status: row.status,
    parentId: row.parent_id,
    createdAt: row.created_at,
    author: mapAuthor(authors.get(row.user_id), row.user_id),
    canReport: Boolean(viewerUserId && viewerUserId !== row.user_id),
  }));
}

export async function createBlogArticleComment(
  supabase: DbClient,
  input: {
    articleSlug: string;
    userId: string;
    body: string;
    parentId?: string | null;
  },
): Promise<{ comment: BlogComment } | { error: string }> {
  const body = parseBlogCommentBody(input.body);
  if (!body) return { error: "Введите текст комментария" };

  const { data, error } = await supabase
    .from("blog_article_comments")
    .insert({
      article_slug: input.articleSlug,
      user_id: input.userId,
      body,
      status: "published",
      parent_id: input.parentId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message || "Не удалось отправить комментарий" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("id", input.userId)
    .maybeSingle();

  return {
    comment: {
      id: data.id,
      articleSlug: data.article_slug,
      body: data.body,
      status: data.status,
      parentId: data.parent_id,
      createdAt: data.created_at,
      author: mapAuthor(profile, input.userId),
      canReport: false,
    },
  };
}

export async function createBlogCommentReport(
  supabase: DbClient,
  input: {
    commentId: string;
    reporterUserId: string;
    reason: BlogCommentReportReason;
    details?: string;
  },
): Promise<{ ok: true } | { error: string }> {
  if (!BLOG_COMMENT_REPORT_REASON_LABELS[input.reason]) {
    return { error: "Укажите причину жалобы" };
  }

  const { error } = await supabase.from("blog_comment_reports").insert({
    comment_id: input.commentId,
    reporter_user_id: input.reporterUserId,
    reason: input.reason,
    details: input.details?.trim().slice(0, 500) ?? null,
  });

  if (error) {
    return { error: error.message || "Не удалось отправить жалобу" };
  }

  return { ok: true };
}
