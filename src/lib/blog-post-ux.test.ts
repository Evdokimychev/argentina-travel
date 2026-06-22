import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";
import { getBlogAdjacentPosts } from "@/lib/blog-adjacent-posts";
import {
  getBlogPostFooterLinks,
  getBlogPostSidebarRelatedResources,
  isValidBlogRelatedResourceHref,
} from "@/lib/blog-related-footer-links";
import type { BlogPost, BlogRelatedResource } from "@/types";

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

describe("isValidBlogRelatedResourceHref", () => {
  it("accepts existing blog slugs", () => {
    const existing = blogPosts[0];
    expect(
      isValidBlogRelatedResourceHref({
        label: existing.title,
        href: `/blog/${existing.slug}`,
        type: "blog",
      }),
    ).toBe(true);
  });

  it("rejects missing blog slugs", () => {
    expect(
      isValidBlogRelatedResourceHref({
        label: "Missing",
        href: "/blog/this-slug-does-not-exist-xyz",
        type: "blog",
      }),
    ).toBe(false);
  });

  it("accepts guide topics from GUIDE_TOPICS", () => {
    expect(
      isValidBlogRelatedResourceHref({
        label: "Как добраться",
        href: "/guide/kak-dobratsya",
        type: "guide",
      }),
    ).toBe(true);
  });

  it("rejects unknown guide slugs", () => {
    expect(
      isValidBlogRelatedResourceHref({
        label: "Unknown",
        href: "/guide/unknown-guide-topic-xyz",
        type: "guide",
      }),
    ).toBe(false);
  });
});

describe("getBlogPostSidebarRelatedResources", () => {
  it("filters invalid blog hrefs", () => {
    const resources: BlogRelatedResource[] = [
      { label: "Valid", href: `/blog/${blogPosts[0].slug}`, type: "blog" },
      { label: "Invalid", href: "/blog/missing-slug-xyz", type: "blog" },
      { label: "Guide", href: "/guide/kak-dobratsya", type: "guide" },
    ];

    const filtered = getBlogPostSidebarRelatedResources({
      ...post({ slug: "test", title: "Test" }),
      relatedResources: resources,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].href).toBe(`/blog/${blogPosts[0].slug}`);
  });
});

describe("getBlogPostFooterLinks", () => {
  it("filters invalid guide hrefs from footer", () => {
    const filtered = getBlogPostFooterLinks({
      ...post({ slug: "test", title: "Test" }),
      relatedResources: [
        { label: "Valid guide", href: "/guide/kak-dobratsya", type: "guide" },
        { label: "Broken guide", href: "/guide/broken-guide-xyz", type: "guide" },
      ],
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].href).toBe("/guide/kak-dobratsya");
  });
});

describe("getBlogAdjacentPosts", () => {
  const catalog = [
    post({ slug: "a", title: "A", category: "Патагония", date: "2026-01-03" }),
    post({ slug: "b", title: "B", category: "Патагония", date: "2026-01-02" }),
    post({ slug: "c", title: "C", category: "Патагония", date: "2026-01-01" }),
  ];

  it("returns prev/next from hub-ordered catalog", () => {
    const adjacent = getBlogAdjacentPosts(catalog[1], catalog);
    expect(adjacent.prev?.slug).toBe("a");
    expect(adjacent.next?.slug).toBe("c");
  });

  it("returns null at boundaries", () => {
    expect(getBlogAdjacentPosts(catalog[0], catalog).prev).toBeNull();
    expect(getBlogAdjacentPosts(catalog[2], catalog).next).toBeNull();
  });
});
