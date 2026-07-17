import { describe, expect, it } from "vitest";
import {
  cmsDocumentSearchId,
  cmsDocumentToSearchIndexItem,
} from "@/lib/search/cms-search-sync";
import type { CmsDocument } from "@/types/cms-content";

const baseDoc: CmsDocument = {
  id: "blog:test:ru",
  docType: "blog",
  slug: "test-slug",
  locale: "ru",
  title: "Тестовая статья",
  status: "published",
  body: { kind: "blog", excerpt: "Кратко", content: "Текст" },
  seo: { description: "SEO описание" },
  publishedAt: "2026-06-01T10:00:00.000Z",
  scheduledPublishAt: null,
  createdBy: null,
  updatedBy: null,
  rowVersion: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("cmsDocumentSearchId", () => {
  it("maps doc types to search ids", () => {
    expect(cmsDocumentSearchId({ docType: "blog", slug: "a" })).toBe("blog-a");
    expect(cmsDocumentSearchId({ docType: "place", slug: "b" })).toBe("place-b");
  });
});

describe("cmsDocumentToSearchIndexItem", () => {
  it("builds blog item for published doc", () => {
    const item = cmsDocumentToSearchIndexItem(baseDoc);
    expect(item).toMatchObject({
      id: "blog-test-slug",
      type: "blog",
      href: "/blog/test-slug",
      title: "Тестовая статья",
    });
  });

  it("returns null for draft", () => {
    expect(cmsDocumentToSearchIndexItem({ ...baseDoc, status: "draft" })).toBeNull();
  });

  it("keeps knowledge documents in the KB namespace", () => {
    const item = cmsDocumentToSearchIndexItem({
      ...baseDoc,
      id: "knowledge:test-slug:ru",
      docType: "knowledge",
    });
    expect(cmsDocumentSearchId({ docType: "knowledge", slug: "test-slug" })).toBe(
      "knowledge-test-slug",
    );
    expect(item).toMatchObject({
      id: "knowledge-test-slug",
      type: "knowledge",
      href: "/baza-znaniy/test-slug",
    });
  });
});
