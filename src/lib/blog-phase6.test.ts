import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";
import { suggestSemanticBlogLinks } from "@/lib/blog-ai-link-suggestions";
import { mergeReadingHistorySignals, scoreBlogPostsFromSignals } from "@/lib/blog-analytics-signals-core";
import { resolveBlogAffiliateEmbed, resolveBlogAffiliateEmbedForPost } from "@/lib/blog-affiliate-embeds";
import { parseBlogReadingHistoryInput } from "@/lib/blog-reading-history-parsers";
import { parseBlogCommentBody, parseBlogCommentSlug } from "@/lib/blog-comments-parsers";
import { GTM_EVENTS } from "@/lib/analytics/gtm-events";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";

describe("blog reading history server", () => {
  it("parses valid reading history input", () => {
    const parsed = parseBlogReadingHistoryInput({
      slug: "patagonia-packing-list",
      title: "Сборы в Патагонию",
      category: "Патагония",
    });
    expect(parsed?.slug).toBe("patagonia-packing-list");
  });
});

describe("blog comments server parsers", () => {
  it("validates comment slug and body", () => {
    expect(parseBlogCommentSlug("  demo  ")).toBe("demo");
    expect(parseBlogCommentBody("  привет  ")).toBe("привет");
    expect(parseBlogCommentBody("   ")).toBeNull();
  });
});

describe("blog analytics signals", () => {
  it("merges local and remote history by latest readAt", () => {
    const signals = mergeReadingHistorySignals(
      [{ slug: "a", title: "A", readAt: "2026-01-02T00:00:00.000Z", category: "Патагония" }],
      [{ slug: "a", title: "A remote", readAt: "2026-01-03T00:00:00.000Z", category: "Патагония" }],
    );
    expect(signals.readSlugs.has("a")).toBe(true);
    expect(signals.categoryWeights.get("Патагония")).toBeGreaterThan(0);
  });

  it("scores posts from category weights", () => {
    const catalog = filterIndexableBlogPosts(blogPosts).slice(0, 20);
    const signals = mergeReadingHistorySignals(
      [{ slug: "x", title: "X", readAt: "2026-01-01T00:00:00.000Z", category: "Патагония" }],
      [],
    );
    const scored = scoreBlogPostsFromSignals(catalog, signals, 3);
    expect(scored.length).toBeGreaterThan(0);
    expect(scored.every((post) => post.slug !== "x")).toBe(true);
  });
});

describe("blog affiliate embeds", () => {
  it("resolves car-rental embed config shape", () => {
    const config = resolveBlogAffiliateEmbed("car-rental");
    expect(config?.service).toBe("car-rental");
  });

  it("picks embed for Patagonia articles", () => {
    const config = resolveBlogAffiliateEmbedForPost({
      category: "Патагония",
      tags: ["trekking"],
    });
    expect(config?.service).toBe("car-rental");
  });
});

describe("blog AI link suggestions", () => {
  it("suggests semantic links by tag overlap", () => {
    const catalog = filterIndexableBlogPosts(blogPosts);
    const mockCatalog = [
      {
        ...catalog[0],
        slug: "packing-demo",
        title: "Сборы в горы",
        tags: ["треккинг", "снаряжение"],
        noIndex: false,
      },
    ];

    const suggestions = suggestSemanticBlogLinks({
      text: "треккинг снаряжение для похода",
      currentSlug: "other-slug",
      catalog: mockCatalog,
      limit: 3,
    });

    expect(suggestions.some((item) => item.slug === "packing-demo")).toBe(true);
  });
});

describe("blog Phase 6 GTM", () => {
  it("registers comment and embed events", () => {
    expect(GTM_EVENTS.blogCommentPost).toBe("blog_comment_post");
    expect(GTM_EVENTS.blogAffiliateEmbedView).toBe("blog_affiliate_embed_view");
  });
});
