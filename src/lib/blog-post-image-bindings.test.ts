import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { blogPosts } from "@/data/blog";
import {
  inferBlogImageTopic,
  pickBlogTopicImage,
  resolveBlogSemanticHeroImage,
} from "@/lib/blog-post-image-bindings";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { resolveBlogPostCardImage } from "@/lib/media-resolver";

function publicMediaExists(src: string): boolean {
  if (!src.startsWith("/media/")) return false;
  return fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

describe("blog semantic hero images", () => {
  it("maps money slugs to money topic, not city", () => {
    expect(inferBlogImageTopic({ slug: "money-nalichnye", category: "Деньги и обмен валют", tags: [] })).toBe(
      "money",
    );
    expect(inferBlogImageTopic({ slug: "kak-menyat-dengi-argentina", category: "Практика", tags: [] })).toBe(
      "money",
    );
  });

  it("money articles resolve to money pool images", () => {
    const image = resolveBlogSemanticHeroImage({
      slug: "money-nalichnye",
      category: "Деньги и обмен валют",
      tags: [],
    });
    expect(image).toMatch(/money|dollar|bankovsk|byudzhet|stoimost|kak-menyat/);
    expect(image).not.toMatch(/buenos-aires\/hero/);
    expect(publicMediaExists(image)).toBe(true);
  });

  it("immigration slugs resolve to immigration pool", () => {
    const image = resolveBlogSemanticHeroImage({
      slug: "vnzh-argentina-rezidenciya",
      category: "Иммиграция",
      tags: [],
    });
    expect(image).toMatch(/visa|vnzh|grazhdanstvo|cuil|bankovsk/);
    expect(publicMediaExists(image)).toBe(true);
  });

  it("assigns different images to slugs in the same topic when pool allows", () => {
    const a = pickBlogTopicImage("money-nalichnye", "money");
    const b = pickBlogTopicImage("money-byudzhet", "money");
    const c = pickBlogTopicImage("money-sovety-novichkam", "money");
    expect(new Set([a, b, c]).size).toBeGreaterThan(1);
  });

  it("indexable posts have existing media and reduced duplicate covers", () => {
    const indexable = filterIndexableBlogPosts(blogPosts);
    const byImage = new Map<string, string[]>();

    for (const post of indexable) {
      const src = resolveBlogPostCardImage(post);
      expect(publicMediaExists(src), `${post.slug} → ${src}`).toBe(true);
      if (!byImage.has(src)) byImage.set(src, []);
      byImage.get(src)!.push(post.slug);
    }

    const uniqueRatio = byImage.size / indexable.length;
    expect(uniqueRatio).toBeGreaterThan(0.45);

    const crossTopicBad = indexable.filter((post) => {
      const src = resolveBlogPostCardImage(post);
      const topic = inferBlogImageTopic(post);
      if (topic === "money" || topic === "immigration" || topic === "internet") {
        return src.includes("/places/buenos-aires/hero");
      }
      return false;
    });
    expect(crossTopicBad.map((p) => p.slug)).toEqual([]);
  });
});
