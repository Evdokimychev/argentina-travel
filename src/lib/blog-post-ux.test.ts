import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { blogPosts } from "@/data/blog";
import { planInlineRelatedSections } from "@/lib/blog-inline-related";
import { resolveBlogAffiliateCards } from "@/lib/blog-affiliate-zones";
import { resolveBlogPostDestinations } from "@/lib/blog-destinations";
import { linkifyBlogText, getBlogInternalLinkRules } from "@/lib/blog-internal-links";
import { getRelatedBlogPosts, getRelatedBlogPostsForSection } from "@/lib/blog-related-posts";
import { getBlogTopicClusterSiblings, buildBlogTopicClusterItemListJsonLd } from "@/lib/blog-topic-cluster";
import { pickBlogIndexFeaturedTours } from "@/lib/blog-index-tours";
import { localSavedArticlesStore } from "@/lib/saved-articles-store";
import { getBlogSectionKind } from "@/lib/blog-section-body";
import { getBlogCategoryTourCta } from "@/data/blog-category-tours";
import { getBlogAdjacentPosts } from "@/lib/blog-adjacent-posts";
import { buildBlogPostBreadcrumbJsonLd, buildBlogPostUiBreadcrumbs } from "@/lib/blog-breadcrumbs";
import { buildBlogQuickFacts, sortBlogPostsByUpdated } from "@/lib/blog-utils";
import {
  getBlogPostFooterLinks,
  getBlogPostSidebarRelatedResources,
  isValidBlogRelatedResourceHref,
} from "@/lib/blog-related-footer-links";
import { getPersonalizedBlogPosts } from "@/lib/blog-personalized";
import { buildBlogRssFeed } from "@/lib/blog-rss";
import { buildBlogAuthorProfiles } from "@/lib/blog-authors";
import { planInlineRelatedRichSectionIndices } from "@/lib/blog-inline-related-rich";
import { GTM_EVENTS } from "@/lib/analytics/gtm-events";
import {
  suggestBlogPostInternalLinks,
  willLinkifyBlogText,
} from "@/lib/blog-internal-link-suggestions";
import {
  parseBlogReadingHistoryCookie,
  serializeBlogReadingHistoryCookie,
} from "@/lib/blog-reading-history-cookie";
import { withBlogAffiliateAttribution } from "@/lib/blog-affiliate-attribution";
import {
  getBlogArticleFeedback,
  setBlogArticleFeedback,
} from "@/lib/blog-article-feedback-store";
import type { BlogPost, BlogRelatedResource } from "@/types";

const root = join(process.cwd(), "src");

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

describe("blog inline related sections", () => {
  it("plans insertions every 3 sections and after FAQ", () => {
    const sections = Array.from({ length: 7 }, (_, i) => ({
      title: i === 1 ? "FAQ" : `Section ${i + 1}`,
      body: "body",
      blockType: i === 1 ? ("faq" as const) : undefined,
    }));

    const indices = planInlineRelatedSections(sections);
    expect(indices).toContain(1);
    expect(indices).toContain(2);
    expect(indices.length).toBeLessThanOrEqual(3);
  });
});

describe("section-aware related posts", () => {
  const catalog = [
    post({
      slug: "source",
      title: "Source",
      category: "Патагония",
      tags: ["ледники"],
      sections: [{ title: "Ледники", body: "Perito Moreno и треккинг" }],
    }),
    post({
      slug: "patagonia-tips",
      title: "Советы по Патагонии",
      category: "Патагония",
      tags: ["ледники", "треккинг"],
    }),
    post({
      slug: "other",
      title: "Other",
      category: "Культура",
      tags: ["танго"],
    }),
  ];

  it("prefers posts matching section context", () => {
    const related = getRelatedBlogPostsForSection(
      catalog[0],
      catalog,
      {
        sectionTitle: "Ледники Perito Moreno",
        sectionBody: "треккинг и ледник",
        sectionKind: "default",
      },
      new Set(["source"]),
      2,
    );
    expect(related.some((p) => p.slug === "patagonia-tips")).toBe(true);
  });

  it("getRelatedBlogPosts works without section context", () => {
    const related = getRelatedBlogPosts(catalog[0], catalog, 2);
    expect(related.length).toBeGreaterThan(0);
  });
});

describe("blog internal links", () => {
  it("links first destination mention", () => {
    const segments = linkifyBlogText("Перед поездкой в Патагонию изучите маршрут.");
    expect(segments.some((s) => s.type === "link" && s.href.includes("/destinations/"))).toBe(true);
  });

  it("exposes rules for destinations and guides", () => {
    const rules = getBlogInternalLinkRules();
    expect(rules.some((r) => r.href.startsWith("/destinations/"))).toBe(true);
    expect(rules.some((r) => r.href.startsWith("/guide/"))).toBe(true);
  });
});

describe("blog destinations and affiliate zones", () => {
  it("resolves destinations from post metadata", () => {
    const destinations = resolveBlogPostDestinations(
      post({
        slug: "x",
        title: "X",
        relatedDestinations: ["calafate", "ba"],
      }),
    );
    expect(destinations.map((d) => d.id)).toEqual(["calafate", "ba"]);
  });

  it("resolves affiliate cards by category", () => {
    const cards = resolveBlogAffiliateCards(
      post({ slug: "x", title: "X", category: "Патагония", tags: [] }),
    );
    expect(cards.some((c) => c.service === "car-rental")).toBe(true);
  });
});

describe("blog topic cluster", () => {
  it("returns hub siblings for patagonia post", () => {
    const sample = blogPosts.find((p) => p.category === "Патагония" && !p.noIndex);
    if (!sample) return;
    const siblings = getBlogTopicClusterSiblings(sample, blogPosts, 4);
    expect(siblings.length).toBeGreaterThan(0);
    expect(siblings.every((s) => s.href.startsWith("/blog/"))).toBe(true);
  });

  it("builds ItemList JSON-LD for clustered post", () => {
    const sample = blogPosts.find((p) => p.category === "Патагония" && !p.noIndex);
    if (!sample) return;
    const jsonLd = buildBlogTopicClusterItemListJsonLd(sample, blogPosts);
    expect(jsonLd?.["@type"]).toBe("ItemList");
    const items = jsonLd?.itemListElement;
    expect(Array.isArray(items) ? items.length : 0).toBeGreaterThan(0);
  });
});

describe("saved articles store interface", () => {
  it("supports toggle without throwing in SSR-safe read", () => {
    expect(localSavedArticlesStore.list()).toEqual([]);
    expect(localSavedArticlesStore.isSaved("missing")).toBe(false);
  });
});

describe("expandable section kinds", () => {
  it("detects tips sections", () => {
    expect(getBlogSectionKind("Практические советы")).toBe("tips");
    expect(getBlogSectionKind("Чек-лист перед поездкой")).toBe("checklist");
  });
});

describe("blog index featured tours", () => {
  it("returns empty without tours", () => {
    expect(pickBlogIndexFeaturedTours([])).toEqual([]);
  });
});

describe("blog Phase 2/3 wiring", () => {
  it("BlogPostView includes cluster nav, affiliate zone and inline related", () => {
    const source = readFileSync(join(root, "components/blog/BlogPostView.tsx"), "utf8");
    expect(source).toContain("BlogTopicClusterNav");
    expect(source).toContain("BlogAffiliateZone");
    expect(source).toContain("BlogDestinationGallery");
    expect(source).toContain("inlineRelatedBySection");
    expect(source).toContain("BlogReadingHistoryRecorder");
  });

  it("BlogIndexView includes trending destinations and popular routes", () => {
    const source = readFileSync(join(root, "components/blog/BlogIndexView.tsx"), "utf8");
    expect(source).toContain("BlogTrendingDestinations");
    expect(source).toContain("BlogPopularRoutes");
    expect(source).toContain("initialTours");
  });

  it("BlogShareBar includes save article button", () => {
    const source = readFileSync(join(root, "components/blog/BlogShareBar.tsx"), "utf8");
    expect(source).toContain("BlogSaveArticleButton");
  });

  it("BlogCard standard uses 3/2 aspect", () => {
    const source = readFileSync(join(root, "components/blog/BlogCard.tsx"), "utf8");
    expect(source).toContain('aspect="3/2"');
  });
});

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
});

describe("blog post UX helpers", () => {
  it("buildBlogQuickFacts derives metadata cards", () => {
    const facts = buildBlogQuickFacts(
      post({
        slug: "patagonia",
        title: "Patagonia",
        category: "Патагония",
        tags: ["ледники", "треккинг"],
        readTimeMinutes: 12,
        editorialReviewed: true,
      }),
    );
    expect(facts.length).toBeGreaterThanOrEqual(3);
    expect(facts.some((f) => f.label === "Тема" && f.headline === "Патагония")).toBe(true);
  });

  it("breadcrumbs include category link", () => {
    const sample = post({ slug: "test", title: "Test", category: "Патагония" });
    const ui = buildBlogPostUiBreadcrumbs(sample);
    expect(ui.some((item) => item.label === "Патагония" && item.href?.includes("category="))).toBe(
      true,
    );
    const jsonLd = buildBlogPostBreadcrumbJsonLd(sample);
    expect(jsonLd.some((item) => item.name === "Патагония")).toBe(true);
  });

  it("category tour CTA resolves known categories", () => {
    expect(getBlogCategoryTourCta("Патагония").query).toBe("Patagonia");
  });
});

describe("blog post view Phase 1 wiring", () => {
  it("BlogPostView includes reading progress and engagement blocks", () => {
    const source = readFileSync(join(root, "components/blog/BlogPostView.tsx"), "utf8");
    expect(source).toContain("ArticleReadingProgress");
    expect(source).toContain("BlogQuickFacts");
    expect(source).toContain("BlogShareBar");
    expect(source).toContain("BlogEngagementCta");
  });
});

describe("blog Phase 4", () => {
  it("personalizes posts from reading history categories", () => {
    const catalog = [
      post({ slug: "a", title: "A", category: "Патагония", tags: ["ледники"] }),
      post({ slug: "b", title: "B", category: "Патагония" }),
      post({ slug: "c", title: "C", category: "Культура" }),
    ];
    const picks = getPersonalizedBlogPosts(
      catalog,
      [{ slug: "read", title: "Read", category: "Патагония", readAt: "2026-01-01" }],
      2,
    );
    expect(picks.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("builds RSS feed xml", () => {
    const xml = buildBlogRssFeed([
      post({ slug: "test-slug", title: "Test", excerpt: "Excerpt", category: "Путеводитель" }),
    ]);
    expect(xml).toContain("<rss");
    expect(xml).toContain("/blog/test-slug");
  });

  it("builds author profiles from catalog", () => {
    const profiles = buildBlogAuthorProfiles([
      post({ slug: "a", title: "A", author: "Редакция «Пора в Аргентину»" }),
      post({ slug: "b", title: "B", author: "Редакция «Пора в Аргентину»" }),
    ]);
    expect(profiles.some((p) => p.slug === "redaktsiya" && p.postCount === 2)).toBe(true);
  });

  it("plans rich inline related indices", () => {
    expect(planInlineRelatedRichSectionIndices(7)).toEqual([2, 5]);
  });

  it("GTM exports blog engagement events", () => {
    expect(GTM_EVENTS.blogArticleSave).toBe("blog_article_save");
    expect(GTM_EVENTS.blogAffiliateClick).toBe("blog_affiliate_click");
    expect(GTM_EVENTS.blogArticleFeedback).toBe("blog_article_feedback");
  });
});

describe("blog Phase 5", () => {
  it("suggests internal links for visa terms", () => {
    const suggestions = suggestBlogPostInternalLinks({
      excerpt: "Для въезда нужна виза или безвизовый режим.",
      sections: [],
    });
    expect(suggestions.some((item) => item.href.includes("visa"))).toBe(true);
  });

  it("serializes reading history cookie", () => {
    const raw = serializeBlogReadingHistoryCookie([
      { slug: "a", title: "A", category: "Патагония" },
    ]);
    const parsed = parseBlogReadingHistoryCookie(decodeURIComponent(raw));
    expect(parsed[0]?.slug).toBe("a");
  });

  it("adds affiliate utm params", () => {
    const href = withBlogAffiliateAttribution("/insurance", {
      postSlug: "test",
      service: "insurance",
    });
    expect(href).toContain("utm_source=blog");
    expect(href).toContain("utm_content=test");
  });

  it("stores article feedback locally", () => {
    const storage = new Map<string, string>();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });

    try {
      setBlogArticleFeedback("demo-slug", "helpful");
      expect(getBlogArticleFeedback("demo-slug")).toBe("helpful");
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    }
  });

  it("detects linkifyable text", () => {
    expect(willLinkifyBlogText("Патагония — must see")).toBe(true);
  });

  it("BlogPostView includes comments section", () => {
    const source = readFileSync(join(root, "components/blog/BlogPostView.tsx"), "utf8");
    expect(source).toContain("BlogCommentsSection");
  });
});
