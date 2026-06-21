import { describe, expect, it } from "vitest";
import { getRelatedBlogPosts } from "@/lib/blog-related-posts";
import { resolveBlogCardVariant } from "@/lib/blog-utils";
import type { BlogPost } from "@/types";

function post(partial: Partial<BlogPost> & Pick<BlogPost, "slug" | "title">): BlogPost {
  const { slug, title, ...rest } = partial;
  return {
    id: slug,
    excerpt: "excerpt",
    content: "",
    author: "Редакция",
    date: "2026-01-01",
    image: "",
    category: "Путеводитель",
    readTime: "5 мин",
    readTimeMinutes: 5,
    tags: [],
    ...rest,
    slug,
    title,
  };
}

describe("resolveBlogCardVariant", () => {
  it("promotes first featured post regardless of grid index", () => {
    const featuredUsed = { value: false };
    const standard = post({ slug: "a", title: "A" });
    const featured = post({ slug: "b", title: "B", featured: true });

    expect(resolveBlogCardVariant(standard, 0, featuredUsed)).toBe("standard");
    expect(resolveBlogCardVariant(featured, 3, featuredUsed)).toBe("featured");
    expect(resolveBlogCardVariant(standard, 4, featuredUsed)).toBe("standard");
  });
});

describe("getRelatedBlogPosts", () => {
  const catalog = [
    post({
      slug: "source",
      title: "Source",
      category: "Патагония",
      tags: ["Патагония", "ледники"],
    }),
    post({
      slug: "match-tags",
      title: "Match tags",
      category: "Путеводитель",
      tags: ["Патагония", "ледники"],
    }),
    post({
      slug: "match-category",
      title: "Match category",
      category: "Патагония",
      tags: ["другое"],
    }),
    post({ slug: "draft", title: "Draft", noIndex: true, category: "Патагония", tags: ["Патагония"] }),
  ];

  it("ranks by tags and category and excludes drafts", () => {
    const related = getRelatedBlogPosts(catalog[0], catalog, 2);
    expect(related.map((p) => p.slug)).toEqual(["match-category", "match-tags"]);
  });
});
