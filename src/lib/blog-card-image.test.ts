import { describe, expect, it } from "vitest";
import { blogPosts, getBlogStartHerePosts } from "@/data/blog";
import { BLOG_START_HERE_SLUGS } from "@/data/blog-canonical-map";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { resolveBlogPostCardImage } from "@/lib/media-resolver";
import fs from "node:fs";
import path from "node:path";

describe("blog card images", () => {
  it("resolves manifest hero for best-time-to-visit-argentina", () => {
    const post = blogPosts.find((p) => p.slug === "best-time-to-visit-argentina");
    expect(post?.image).toBe("/media/blog/best-time-to-visit-argentina/hero.jpg");

    const publicPath = path.join(
      process.cwd(),
      "public",
      post!.image!.replace(/^\//, ""),
    );
    expect(fs.existsSync(publicPath)).toBe(true);
  });

  it("indexable posts resolve to existing public media files", () => {
    const indexable = filterIndexableBlogPosts(blogPosts);
    const bad = indexable.filter((post) => {
      const src = post.image ?? "";
      if (!src || src === "/logo-light.svg" || !src.startsWith("/media/")) return true;
      const publicPath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
      return !fs.existsSync(publicPath);
    });

    expect(
      bad.map((p) => ({ slug: p.slug, image: p.image })),
      `missing hero files: ${bad.length}`,
    ).toEqual([]);
  });

  it("resolveBlogPostCardImage prefers manifest over stale post.image", () => {
    const resolved = resolveBlogPostCardImage({
      slug: "best-time-to-visit-argentina",
      category: "Планирование",
      image: "/logo-light.svg",
    });
    expect(resolved).toBe("/media/blog/best-time-to-visit-argentina/hero.jpg");
  });

  it("getBlogStartHerePosts returns manifest heroes, not empty manual placeholders", () => {
    const posts = getBlogStartHerePosts();
    expect(posts).toHaveLength(BLOG_START_HERE_SLUGS.length);

    const lead = posts.find((post) => post.slug === "best-time-to-visit-argentina");
    expect(lead?.image).toBe("/media/blog/best-time-to-visit-argentina/hero.jpg");

    for (const post of posts) {
      expect(post.image, post.slug).toBeTruthy();
      expect(post.image, post.slug).not.toBe("");
      expect(post.image, post.slug).not.toBe("/logo-light.svg");
      expect(post.image, post.slug).toMatch(/^\/media\//);
    }
  });
});
