import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import {
  forumAccountAgeMessage,
  isAccountOldEnoughForForum,
  sanitizeForumBody,
  sanitizeForumTitle,
} from "@/lib/forum/forum-body";
import type {
  ForumAuthor,
  ForumCategory,
  ForumPost,
  ForumReportReason,
  ForumThreadDetail,
  ForumThreadSummary,
} from "@/lib/forum/forum-types";
import { FORUM_REPORT_REASON_LABELS } from "@/lib/forum/forum-types";

type DbClient = SupabaseClient<Database>;

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name"
>;

function mapAuthor(profile: ProfileRow | null | undefined, authorId: string | null): ForumAuthor {
  if (!authorId) {
    return { id: null, displayName: "Редакция" };
  }

  const first = profile?.first_name?.trim() ?? "";
  const last = profile?.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();

  return {
    id: authorId,
    displayName: full || "Участник",
  };
}

async function loadAuthors(
  supabase: DbClient,
  authorIds: Array<string | null>
): Promise<Map<string, ProfileRow>> {
  const ids = [...new Set(authorIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", ids);

  return new Map((data ?? []).map((row) => [row.id, row]));
}

function mapCategory(row: Database["public"]["Tables"]["forum_categories"]["Row"]): ForumCategory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    publicRead: row.public_read,
    sortOrder: row.sort_order,
  };
}

export async function fetchForumCategories(supabase: DbClient): Promise<ForumCategory[]> {
  const { data, error } = await supabase
    .from("forum_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error || !data?.length) return [];

  const categories = data.map(mapCategory);
  const categoryIds = categories.map((category) => category.id);

  const { data: threadCounts } = await supabase
    .from("forum_threads")
    .select("category_id")
    .in("category_id", categoryIds);

  const countByCategory = new Map<string, number>();
  for (const row of threadCounts ?? []) {
    countByCategory.set(row.category_id, (countByCategory.get(row.category_id) ?? 0) + 1);
  }

  return categories.map((category) => ({
    ...category,
    threadCount: countByCategory.get(category.id) ?? 0,
  }));
}

export async function fetchForumCategoryBySlug(
  supabase: DbClient,
  slug: string
): Promise<ForumCategory | null> {
  const { data, error } = await supabase
    .from("forum_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapCategory(data);
}

export async function fetchForumThreadsByCategorySlug(
  supabase: DbClient,
  categorySlug: string
): Promise<{ category: ForumCategory; threads: ForumThreadSummary[] } | null> {
  const category = await fetchForumCategoryBySlug(supabase, categorySlug);
  if (!category) return null;

  const { data: threads, error } = await supabase
    .from("forum_threads")
    .select("*")
    .eq("category_id", category.id)
    .order("pinned", { ascending: false })
    .order("last_post_at", { ascending: false });

  if (error) return { category, threads: [] };

  const threadIds = (threads ?? []).map((thread) => thread.id);
  const replyCountByThread = new Map<string, number>();

  if (threadIds.length) {
    const { data: posts } = await supabase
      .from("forum_posts")
      .select("thread_id")
      .in("thread_id", threadIds)
      .eq("status", "published");

    for (const post of posts ?? []) {
      replyCountByThread.set(post.thread_id, (replyCountByThread.get(post.thread_id) ?? 0) + 1);
    }
  }

  const authors = await loadAuthors(
    supabase,
    (threads ?? []).map((thread) => thread.author_id)
  );

  const mapped = (threads ?? []).map((thread) => ({
    id: thread.id,
    categoryId: thread.category_id,
    categorySlug: category.slug,
    categoryTitle: category.title,
    categoryPublicRead: category.publicRead,
    title: thread.title,
    pinned: thread.pinned,
    locked: thread.locked,
    lastPostAt: thread.last_post_at,
    createdAt: thread.created_at,
    author: mapAuthor(
      thread.author_id ? authors.get(thread.author_id) : undefined,
      thread.author_id
    ),
    replyCount: Math.max(0, (replyCountByThread.get(thread.id) ?? 1) - 1),
  }));

  return { category, threads: mapped };
}

export async function fetchForumThreadDetail(
  supabase: DbClient,
  categorySlug: string,
  threadId: string
): Promise<ForumThreadDetail | null> {
  const category = await fetchForumCategoryBySlug(supabase, categorySlug);
  if (!category) return null;

  const { data: thread, error } = await supabase
    .from("forum_threads")
    .select("*")
    .eq("id", threadId)
    .eq("category_id", category.id)
    .maybeSingle();

  if (error || !thread) return null;

  const { data: posts } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });

  const authors = await loadAuthors(supabase, [
    thread.author_id,
    ...(posts ?? []).map((post) => post.author_id),
  ]);

  const mappedPosts: ForumPost[] = (posts ?? []).map((post) => ({
    id: post.id,
    threadId: post.thread_id,
    body: post.body,
    status: post.status as ForumPost["status"],
    editedAt: post.edited_at,
    createdAt: post.created_at,
    author: mapAuthor(
      post.author_id ? authors.get(post.author_id) : undefined,
      post.author_id
    ),
  }));

  return {
    id: thread.id,
    categoryId: thread.category_id,
    categorySlug: category.slug,
    categoryTitle: category.title,
    categoryPublicRead: category.publicRead,
    title: thread.title,
    pinned: thread.pinned,
    locked: thread.locked,
    lastPostAt: thread.last_post_at,
    createdAt: thread.created_at,
    author: mapAuthor(
      thread.author_id ? authors.get(thread.author_id) : undefined,
      thread.author_id
    ),
    replyCount: Math.max(0, mappedPosts.length - 1),
    posts: mappedPosts,
  };
}

async function assertForumPostingAllowed(
  supabase: DbClient,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, is_blocked")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_blocked) {
    return { error: "Аккаунт заблокирован" };
  }

  if (!isAccountOldEnoughForForum(profile?.created_at)) {
    return { error: forumAccountAgeMessage() };
  }

  return { ok: true };
}

export async function createForumThread(
  supabase: DbClient,
  input: {
    categorySlug: string;
    authorId: string;
    title: string;
    body: string;
  }
): Promise<{ thread: ForumThreadDetail } | { error: string }> {
  const posting = await assertForumPostingAllowed(supabase, input.authorId);
  if ("error" in posting) return posting;

  const category = await fetchForumCategoryBySlug(supabase, input.categorySlug);
  if (!category) return { error: "Раздел не найден" };

  const titleResult = sanitizeForumTitle(input.title);
  if ("error" in titleResult) return titleResult;

  const bodyResult = sanitizeForumBody(input.body);
  if ("error" in bodyResult) return bodyResult;

  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .insert({
      category_id: category.id,
      author_id: input.authorId,
      title: titleResult.title,
    })
    .select("*")
    .single();

  if (threadError || !thread) {
    return { error: threadError?.message ?? "Не удалось создать тему" };
  }

  const { data: post, error: postError } = await supabase
    .from("forum_posts")
    .insert({
      thread_id: thread.id,
      author_id: input.authorId,
      body: bodyResult.body,
    })
    .select("*")
    .single();

  if (postError || !post) {
    return { error: postError?.message ?? "Не удалось создать первое сообщение" };
  }

  const authors = await loadAuthors(supabase, [input.authorId]);
  const author = mapAuthor(authors.get(input.authorId), input.authorId);

  return {
    thread: {
      id: thread.id,
      categoryId: thread.category_id,
      categorySlug: category.slug,
      categoryTitle: category.title,
      categoryPublicRead: category.publicRead,
      title: thread.title,
      pinned: thread.pinned,
      locked: thread.locked,
      lastPostAt: thread.last_post_at,
      createdAt: thread.created_at,
      author,
      replyCount: 0,
      posts: [
        {
          id: post.id,
          threadId: post.thread_id,
          body: post.body,
          status: "published",
          editedAt: post.edited_at,
          createdAt: post.created_at,
          author,
        },
      ],
    },
  };
}

export async function createForumPost(
  supabase: DbClient,
  input: {
    threadId: string;
    authorId: string;
    body: string;
  }
): Promise<{ post: ForumPost; categorySlug: string } | { error: string }> {
  const posting = await assertForumPostingAllowed(supabase, input.authorId);
  if ("error" in posting) return posting;

  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select("id, locked, category_id, forum_categories(slug)")
    .eq("id", input.threadId)
    .maybeSingle();

  if (threadError || !thread) return { error: "Тема не найдена" };
  if (thread.locked) return { error: "Тема закрыта для новых сообщений" };

  const bodyResult = sanitizeForumBody(input.body);
  if ("error" in bodyResult) return bodyResult;

  const { data: post, error: postError } = await supabase
    .from("forum_posts")
    .insert({
      thread_id: thread.id,
      author_id: input.authorId,
      body: bodyResult.body,
    })
    .select("*")
    .single();

  if (postError || !post) {
    return { error: postError?.message ?? "Не удалось отправить сообщение" };
  }

  const authors = await loadAuthors(supabase, [input.authorId]);
  const categorySlug =
    (thread.forum_categories as { slug: string } | null)?.slug ?? "";

  return {
    categorySlug,
    post: {
      id: post.id,
      threadId: post.thread_id,
      body: post.body,
      status: "published",
      editedAt: post.edited_at,
      createdAt: post.created_at,
      author: mapAuthor(authors.get(input.authorId), input.authorId),
    },
  };
}

export type ForumPostModerationSummary = {
  id: string;
  body: string;
  threadTitle: string;
  categorySlug: string;
  categoryTitle: string;
  authorName: string | null;
  reason: string;
  reasonLabel: string;
  details: string | null;
  reporterName: string | null;
};

export async function fetchForumPostModerationSummaries(
  supabase: DbClient,
  postIds: string[]
): Promise<Map<string, ForumPostModerationSummary>> {
  if (!postIds.length) return new Map();

  const { data: posts } = await supabase
    .from("forum_posts")
    .select("id, body, thread_id, author_id")
    .in("id", postIds);

  if (!posts?.length) return new Map();

  const threadIds = [...new Set(posts.map((post) => post.thread_id))];
  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, title, category_id, forum_categories(slug, title)")
    .in("id", threadIds);

  const threadsById = new Map((threads ?? []).map((thread) => [thread.id, thread]));
  const authorIds = posts.map((post) => post.author_id).filter(Boolean) as string[];
  const authors = await loadAuthors(supabase, authorIds);

  const result = new Map<string, ForumPostModerationSummary>();

  for (const post of posts) {
    const thread = threadsById.get(post.thread_id);
    const category = thread?.forum_categories as { slug: string; title: string } | null;
    const author = post.author_id ? authors.get(post.author_id) : undefined;

    result.set(post.id, {
      id: post.id,
      body: post.body,
      threadTitle: thread?.title ?? "Тема",
      categorySlug: category?.slug ?? "",
      categoryTitle: category?.title ?? "",
      authorName: post.author_id
        ? mapAuthor(author, post.author_id).displayName
        : null,
      reason: "",
      reasonLabel: "",
      details: null,
      reporterName: null,
    });
  }

  return result;
}

export async function submitForumPostReport(
  supabase: DbClient,
  input: {
    postId: string;
    reporterUserId: string;
    reason: ForumReportReason;
    details?: string;
  }
): Promise<{ reportId: string } | { error: string }> {
  const { data: post, error: postError } = await supabase
    .from("forum_posts")
    .select("id, body, status, thread_id")
    .eq("id", input.postId)
    .maybeSingle();

  if (postError || !post) return { error: "Сообщение не найдено" };
  if (post.status !== "published") return { error: "Сообщение недоступно" };

  const { data: existing } = await supabase
    .from("forum_post_reports")
    .select("id")
    .eq("post_id", input.postId)
    .eq("reporter_user_id", input.reporterUserId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "Вы уже отправили жалобу на это сообщение" };
  }

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("title, forum_categories(slug, title)")
    .eq("id", post.thread_id)
    .maybeSingle();

  const category = thread?.forum_categories as { slug: string; title: string } | null;
  const reasonLabel = FORUM_REPORT_REASON_LABELS[input.reason];

  const { data: report, error: reportError } = await supabase
    .from("forum_post_reports")
    .insert({
      post_id: input.postId,
      reporter_user_id: input.reporterUserId,
      reason: input.reason,
      details: input.details?.trim() || null,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return { error: reportError?.message ?? "Не удалось отправить жалобу" };
  }

  await supabase.from("moderation_queue").upsert(
    {
      entity_type: "forum_post",
      entity_id: post.id,
      status: "pending",
      reason: `Жалоба на сообщение: ${reasonLabel}`,
      submitted_by: input.reporterUserId,
      metadata: {
        reportId: report.id,
        threadTitle: thread?.title ?? null,
        categorySlug: category?.slug ?? null,
        categoryTitle: category?.title ?? null,
        reason: input.reason,
        reasonLabel,
        details: input.details?.trim() || null,
        bodyPreview: post.body.slice(0, 280),
      } as Json,
    },
    { onConflict: "entity_type,entity_id" }
  );

  return { reportId: report.id };
}

export async function resolveForumPostModeration(
  supabase: DbClient,
  postId: string,
  action: "approve" | "reject",
  actorUserId: string,
  metadata: Record<string, unknown> | null
): Promise<{ ok: true } | { error: string }> {
  const now = new Date().toISOString();
  const reportId =
    metadata && typeof metadata.reportId === "string" ? metadata.reportId : null;

  if (action === "approve") {
    const { error } = await supabase
      .from("forum_posts")
      .update({ status: "hidden" })
      .eq("id", postId);

    if (error) return { error: error.message };
  }

  if (reportId) {
    const { error } = await supabase
      .from("forum_post_reports")
      .update({
        status: action === "approve" ? "resolved" : "dismissed",
        resolved_by: actorUserId,
        resolved_at: now,
      })
      .eq("id", reportId);

    if (error) return { error: error.message };
  }

  return { ok: true };
}
