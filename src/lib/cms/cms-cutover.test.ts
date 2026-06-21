import { describe, expect, it } from "vitest";
import {
  blogPostsFromCmsDocuments,
  guidePagesFromCmsDocuments,
} from "@/lib/cms/cms-cutover";
import type { CmsDocument } from "@/types/cms-content";

function baseDoc(overrides: Partial<CmsDocument>): CmsDocument {
  return {
    id: "blog:test:ru",
    docType: "blog",
    slug: "test",
    locale: "ru",
    title: "Тест",
    status: "published",
    body: { kind: "blog", excerpt: "Кратко", content: "Текст статьи" },
    seo: {},
    publishedAt: "2026-01-15T10:00:00.000Z",
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("blogPostsFromCmsDocuments", () => {
  it("maps complete blog documents and sorts by date desc", () => {
    const docs: CmsDocument[] = [
      baseDoc({
        id: "blog:older:ru",
        slug: "older",
        title: "Старее",
        publishedAt: "2026-01-01T10:00:00.000Z",
      }),
      baseDoc({
        id: "blog:newer:ru",
        slug: "newer",
        title: "Новее",
        publishedAt: "2026-02-01T10:00:00.000Z",
      }),
    ];

    const posts = blogPostsFromCmsDocuments(docs);
    expect(posts.map((p) => p.slug)).toEqual(["newer", "older"]);
    expect(posts[0]?.title).toBe("Новее");
  });

  it("skips incomplete or non-blog documents", () => {
    const docs: CmsDocument[] = [
      baseDoc({ title: "   " }),
      baseDoc({
        id: "guide:x:ru",
        docType: "guide",
        slug: "x",
        body: {
          kind: "guide",
          description: "desc",
          sections: [{ heading: "H", paragraphs: ["p"] }],
        },
      }),
    ];

    expect(blogPostsFromCmsDocuments(docs)).toEqual([]);
  });
});

describe("guidePagesFromCmsDocuments", () => {
  it("maps complete guide documents", () => {
    const docs: CmsDocument[] = [
      baseDoc({
        id: "guide:visa:ru",
        docType: "guide",
        slug: "visa",
        title: "Виза",
        body: {
          kind: "guide",
          description: "О визах",
          sections: [{ heading: "Раздел", paragraphs: ["Абзац"] }],
        },
      }),
    ];

    const pages = guidePagesFromCmsDocuments(docs);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      slug: "visa",
      section: "guide",
      title: "Виза",
    });
  });

  it("orders by orderSlugs then appends CMS-only alphabetically", () => {
    const docs: CmsDocument[] = [
      baseDoc({
        id: "guide:b:ru",
        docType: "guide",
        slug: "b-page",
        title: "Б",
        body: {
          kind: "guide",
          description: "b",
          sections: [{ heading: "H", paragraphs: ["p"] }],
        },
      }),
      baseDoc({
        id: "guide:a:ru",
        docType: "guide",
        slug: "a-page",
        title: "А",
        body: {
          kind: "guide",
          description: "a",
          sections: [{ heading: "H", paragraphs: ["p"] }],
        },
      }),
      baseDoc({
        id: "guide:c:ru",
        docType: "guide",
        slug: "c-page",
        title: "В",
        body: {
          kind: "guide",
          description: "c",
          sections: [{ heading: "H", paragraphs: ["p"] }],
        },
      }),
    ];

    const pages = guidePagesFromCmsDocuments(docs, ["c-page", "missing"]);
    expect(pages.map((p) => p.slug)).toEqual(["c-page", "a-page", "b-page"]);
  });
});
