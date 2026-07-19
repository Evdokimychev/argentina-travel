import { describe, expect, it } from "vitest";
import { blogPostFromCms, type CmsDocument } from "@/types/cms-content";
import type { BlogPost } from "@/types";

function fallback(dateModified: string): BlogPost {
  return {
    id: "blog-example",
    slug: "example",
    title: "Новая редакция",
    excerpt: "Актуальный лид",
    content: "",
    sections: [{ title: "Новый раздел", body: "Новый текст." }],
    author: "Редакция",
    date: "2026-01-01",
    dateModified,
    image: "",
    category: "Путеводитель",
    readTime: "5 мин",
    readTimeMinutes: 5,
    tags: [],
  };
}

function cms(updatedAt: string): CmsDocument {
  return {
    id: "blog:example:ru",
    docType: "blog",
    slug: "example",
    locale: "ru",
    title: "Старая редакция",
    status: "published",
    body: {
      kind: "blog",
      excerpt: "Старый лид",
      sections: [{ title: "Старый раздел", body: "Старый текст." }],
    },
    seo: {},
    publishedAt: updatedAt,
    scheduledPublishAt: null,
    createdBy: null,
    updatedBy: null,
    rowVersion: 1,
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("blog CMS freshness", () => {
  it("keeps a reviewed file article when it is newer than the CMS snapshot", () => {
    const post = blogPostFromCms(
      cms("2026-06-21T17:46:32.383Z"),
      fallback("2026-07-18"),
    );

    expect(post?.title).toBe("Новая редакция");
    expect(post?.sections?.[0]?.title).toBe("Новый раздел");
  });

  it("uses CMS content after a newer CMS publication", () => {
    const post = blogPostFromCms(
      cms("2026-08-01T10:00:00.000Z"),
      fallback("2026-07-18"),
    );

    expect(post?.title).toBe("Старая редакция");
    expect(post?.sections?.[0]?.title).toBe("Старый раздел");
  });
});
