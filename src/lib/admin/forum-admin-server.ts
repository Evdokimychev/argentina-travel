import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  forumAdminError,
  type AdminForumCategory,
  type AdminForumThread,
  type ForumCategoryDraft,
} from "@/lib/admin/forum-admin-contract";

type CategoryRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  public_read: boolean;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

type ThreadRow = {
  id: string;
  category_id: string;
  title: string;
  pinned: boolean;
  locked: boolean;
  last_post_at: string;
  updated_at: string;
};

type RpcPayload = { ok?: boolean; code?: string; category?: Record<string, unknown> };

function mapCategory(row: CategoryRow, threadCount: number): AdminForumCategory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    publicRead: row.public_read,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    updatedAt: row.updated_at,
    threadCount,
  };
}

export async function fetchAdminForumOverview(): Promise<{
  categories: AdminForumCategory[];
  threads: AdminForumThread[];
}> {
  const supabase = createSupabaseAdminClient();
  // The migration intentionally leads generated types; keep the untyped boundary server-only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const [categoryResult, threadResult] = await Promise.all([
    db
      .from("forum_categories")
      .select("id, slug, title, description, public_read, sort_order, is_active, updated_at")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
    db
      .from("forum_threads")
      .select("id, category_id, title, pinned, locked, last_post_at, updated_at")
      .order("pinned", { ascending: false })
      .order("last_post_at", { ascending: false })
      .limit(250),
  ]);

  if (categoryResult.error || threadResult.error) {
    throw new Error("FORUM_ADMIN_UNAVAILABLE");
  }

  const categoryRows = (categoryResult.data ?? []) as CategoryRow[];
  const threadRows = (threadResult.data ?? []) as ThreadRow[];
  const threadIds = threadRows.map((thread) => thread.id);
  const postCounts = new Map<string, number>();

  if (threadIds.length > 0) {
    const postResult = await db.from("forum_posts").select("thread_id").in("thread_id", threadIds);
    if (postResult.error) throw new Error("FORUM_ADMIN_UNAVAILABLE");
    for (const post of (postResult.data ?? []) as Array<{ thread_id: string }>) {
      postCounts.set(post.thread_id, (postCounts.get(post.thread_id) ?? 0) + 1);
    }
  }

  const threadCountByCategory = new Map<string, number>();
  for (const thread of threadRows) {
    threadCountByCategory.set(
      thread.category_id,
      (threadCountByCategory.get(thread.category_id) ?? 0) + 1,
    );
  }
  const categoryById = new Map(categoryRows.map((category) => [category.id, category]));

  return {
    categories: categoryRows.map((category) =>
      mapCategory(category, threadCountByCategory.get(category.id) ?? 0),
    ),
    threads: threadRows.flatMap((thread) => {
      const category = categoryById.get(thread.category_id);
      if (!category) return [];
      return [{
        id: thread.id,
        categoryId: thread.category_id,
        categoryTitle: category.title,
        categorySlug: category.slug,
        title: thread.title,
        pinned: thread.pinned,
        locked: thread.locked,
        lastPostAt: thread.last_post_at,
        updatedAt: thread.updated_at,
        postCount: postCounts.get(thread.id) ?? 0,
      }];
    }),
  };
}

export async function mutateForumCategory(input: {
  action: "create" | "update" | "delete";
  actorId: string;
  categoryId: string | null;
  expectedUpdatedAt: string | null;
  slug: string;
  draft: ForumCategoryDraft;
  ipAddress: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_manage_forum_category", {
    p_action: input.action,
    p_actor_id: input.actorId,
    p_category_id: input.categoryId,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_slug: input.slug,
    p_title: input.draft.title,
    p_description: input.draft.description,
    p_sort_order: input.draft.sortOrder,
    p_public_read: input.draft.publicRead,
    p_is_active: input.draft.isActive,
    p_ip_address: input.ipAddress,
  });
  if (error) return { ok: false, ...forumAdminError(undefined) };
  const payload = data as RpcPayload | null;
  if (!payload?.ok) return { ok: false, ...forumAdminError(payload?.code) };
  return { ok: true };
}

export async function setForumThreadState(input: {
  actorId: string;
  threadId: string;
  expectedPinned: boolean;
  expectedLocked: boolean;
  nextPinned: boolean;
  nextLocked: boolean;
  ipAddress: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_set_forum_thread_state", {
    p_thread_id: input.threadId,
    p_actor_id: input.actorId,
    p_expected_pinned: input.expectedPinned,
    p_expected_locked: input.expectedLocked,
    p_next_pinned: input.nextPinned,
    p_next_locked: input.nextLocked,
    p_ip_address: input.ipAddress,
  });
  if (error) return { ok: false, ...forumAdminError(undefined) };
  const payload = data as RpcPayload | null;
  if (!payload?.ok) return { ok: false, ...forumAdminError(payload?.code) };
  return { ok: true };
}
