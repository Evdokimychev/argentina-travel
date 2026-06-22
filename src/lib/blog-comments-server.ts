import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  BLOG_COMMENT_REPORT_REASON_LABELS,
  type BlogComment,
  type BlogCommentAuthor,
  type BlogCommentReportReason,
} from "@/lib/blog-comments-types";

import {
  parseBlogCommentBody,
} from "@/lib/blog-comments-parsers";

export type { BlogComment, BlogCommentAuthor, BlogCommentReportReason };
export { BLOG_COMMENT_REPORT_REASON_LABELS };

type DbClient = SupabaseClient<Database>;

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
