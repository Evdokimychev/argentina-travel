import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  forumAdminError,
  forumCategorySlug,
  validateForumCategoryDraft,
} from "@/lib/admin/forum-admin-contract";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("forum owner controls", () => {
  it("normalizes an owner-friendly category draft and rejects destructive values", () => {
    expect(validateForumCategoryDraft({
      title: "  Жизнь в Аргентине ",
      description: "  Вопросы участников ",
      sortOrder: "20",
      publicRead: true,
      isActive: false,
    })).toEqual({
      ok: true,
      value: {
        title: "Жизнь в Аргентине",
        description: "Вопросы участников",
        sortOrder: 20,
        publicRead: true,
        isActive: false,
      },
    });
    expect(validateForumCategoryDraft({
      title: "A",
      sortOrder: -1,
      publicRead: true,
      isActive: true,
    })).toMatchObject({ ok: false });
  });

  it("creates stable Russian slugs and safe owner-facing failures", () => {
    expect(forumCategorySlug("Жизнь в Аргентине")).toBe("zhizn-v-argentine");
    expect(forumAdminError("version_conflict")).toMatchObject({ status: 409 });
    expect(forumAdminError("category_not_empty")).toEqual({
      status: 409,
      error: "В разделе есть темы. Чтобы сохранить обсуждения, выключите «Показывать раздел».",
    });
    expect(forumAdminError("unexpected").error).not.toMatch(/database|supabase|postgres/i);
  });

  it("keeps every mutation capability-guarded and session-owned", () => {
    const categoriesRoute = source("src/app/api/admin/forum/route.ts");
    const threadRoute = source("src/app/api/admin/forum/threads/[id]/route.ts");
    for (const route of [categoriesRoute, threadRoute]) {
      expect(route).toContain('"marketplace.moderation"');
      expect(route).toContain('auth.via !== "session"');
      expect(route).not.toContain("writeAdminAuditLog");
    }
    expect(categoriesRoute).toContain('"Cache-Control": "private, no-store"');
  });

  it("locks rows, compares expected state and commits audit atomically", () => {
    const migration = source("supabase/migrations/20260717037000_forum_admin_controls.sql");
    expect(migration).toContain("private.admin_forum_actor_allowed");
    expect(migration).toContain("for update;");
    expect(migration).toContain("category_not_empty");
    expect(migration).toContain("version_conflict");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("old.updated_at + interval '1 microsecond'");
    expect(migration).toContain("grant execute on function public.admin_set_forum_thread_state");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("category.is_active = true");
    expect(migration).toContain('drop policy if exists "forum_threads_update_author"');
    expect(migration).toContain('drop policy if exists "forum_threads_staff_all"');
    expect(migration).toContain("and pinned = false");
    expect(migration).toContain("and locked = false");
  });

  it("makes the admin destination discoverable without changing capability semantics", () => {
    const nav = source("src/lib/admin/nav-config.ts");
    const view = source("src/components/admin/views/ForumAdminView.tsx");
    expect(nav).toContain('href: "/admin/content/forum"');
    expect(nav).toContain('capability: "marketplace.moderation"');
    expect(view).toContain("Скрытие безопаснее удаления");
    expect(view).toContain("expectedPinned: thread.pinned");
    expect(view).toContain("expectedLocked: thread.locked");
  });
});
