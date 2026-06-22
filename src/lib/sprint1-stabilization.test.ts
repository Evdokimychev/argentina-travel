import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { buildStaticSearchIndex } from "@/lib/site-search-index";

describe("Sprint 1 stabilization", () => {
  it("blog nav lists only recent indexable posts (max 12)", () => {
    const blogSection = SITE_NAV_SECTIONS.find((section) => section.id === "journal");
    const recentColumn = blogSection?.columns?.find((col) => col.id === "journal-recent");
    const links = recentColumn?.links ?? [];

    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(12);

    const indexableSlugs = new Set(filterIndexableBlogPosts(blogPosts).map((post) => post.slug));
    for (const link of links) {
      const slug = link.href.replace("/blog/", "");
      expect(indexableSlugs.has(slug)).toBe(true);
    }
  });

  it("static search index excludes noIndex blog posts", () => {
    const items = buildStaticSearchIndex();
    const blogItems = items.filter((item) => item.type === "blog");
    const noIndexSlugs = new Set(blogPosts.filter((post) => post.noIndex).map((post) => post.slug));

    for (const item of blogItems) {
      const slug = item.href.replace("/blog/", "");
      expect(noIndexSlugs.has(slug)).toBe(false);
    }
  });
});
