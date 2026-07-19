import { describe, expect, it } from "vitest";
import { resolveAuthorArticleWorkflow } from "@/lib/cms/author-article-workflow";
import type { CmsDocument } from "@/types/cms-content";

const document: CmsDocument = {
  id: "author_article:test:ru",
  docType: "author_article",
  slug: "test",
  locale: "ru",
  title: "Тестовая статья",
  status: "draft",
  body: { kind: "author_article", excerpt: "Описание", sections: [] },
  seo: {},
  publishedAt: null,
  scheduledPublishAt: null,
  createdBy: "user-1",
  updatedBy: "user-1",
  rowVersion: 1,
  createdAt: "2026-07-14T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
};

describe("author article workflow", () => {
  it("maps pending moderation to review", () => {
    expect(resolveAuthorArticleWorkflow(document, {
      status: "pending",
      reason: "Редакционная проверка",
      updated_at: "2026-07-14T01:00:00.000Z",
    }).status).toBe("in_review");
  });

  it("returns editor feedback after rejection", () => {
    const workflow = resolveAuthorArticleWorkflow(document, {
      status: "rejected",
      reason: "Добавьте источник",
      updated_at: "2026-07-14T02:00:00.000Z",
    });
    expect(workflow.status).toBe("changes_requested");
    expect(workflow.note).toBe("Добавьте источник");
  });

  it("prioritizes publication state", () => {
    expect(resolveAuthorArticleWorkflow({ ...document, status: "published" }, {
      status: "approved",
      reason: null,
      updated_at: "2026-07-14T03:00:00.000Z",
    }).status).toBe("published");
  });
});
