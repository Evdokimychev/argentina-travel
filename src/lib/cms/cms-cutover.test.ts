import { describe, expect, it } from "vitest";
import {
  blogPostsFromCmsDocuments,
  evaluateCutoverLane,
  guidePagesFromCmsDocuments,
  destinationsFromCmsDocuments,
} from "@/lib/cms/cms-cutover";
import { getAllDestinations } from "@/lib/destinations";
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
    scheduledPublishAt: null,
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

describe("evaluateCutoverLane", () => {
  it("requires all TS slugs in CMS before canEnable", () => {
    const stats = evaluateCutoverLane(["a", "b", "c"], ["a", "b"], false);
    expect(stats.canEnable).toBe(false);
    expect(stats.missingSlugs).toEqual(["c"]);
    expect(stats.coveragePercent).toBe(67);
  });

  it("marks ready when cutover off even if incomplete", () => {
    const stats = evaluateCutoverLane(["a"], [], false);
    expect(stats.ready).toBe(true);
    expect(stats.canEnable).toBe(false);
  });

  it("marks not ready when cutover on but incomplete", () => {
    const stats = evaluateCutoverLane(["a", "b"], ["a"], true);
    expect(stats.ready).toBe(false);
    expect(stats.cutover).toBe(true);
  });

  it("allows enable at full coverage", () => {
    const stats = evaluateCutoverLane(["a", "b"], ["a", "b"], false);
    expect(stats.canEnable).toBe(true);
    expect(stats.coveragePercent).toBe(100);
  });
});

describe("destinationsFromCmsDocuments", () => {
  it("maps complete destination documents preserving order", () => {
    const tsOrder = getAllDestinations().slice(0, 2).map((d) => d.id);
    if (tsOrder.length < 2) return;

    const docs = tsOrder.map((slug, index) =>
      baseDoc({
        id: `destination:${slug}:ru`,
        docType: "destination",
        slug,
        title: `Dest ${index}`,
        body: {
          kind: "destination",
          description: "Описание направления",
          intro: "Intro",
        },
      })
    );

    const pages = destinationsFromCmsDocuments(docs, tsOrder);
    expect(pages.map((p) => p.id)).toEqual(tsOrder);
  });
});
