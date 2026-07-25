import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";
import { BLOG_AUTHOR_IVAN } from "@/data/blog-author-ivan";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import {
  PATAGONIA_PACKING_LIST_EXCERPT,
  PATAGONIA_PACKING_LIST_SEO_DESCRIPTION,
  PATAGONIA_PACKING_LIST_SLUG,
} from "@/data/blog-patagonia-packing-list";
import { PATAGONIA_PACKING_MEDIA } from "@/data/media/patagonia-packing-list-media";
import { PATAGONIA_PACKING_ITEMS } from "@/data/patagonia-packing-list";
import { getBlogTourEmbeds } from "@/data/blog-tour-embeds";
import { buildBlogArticleJsonLd } from "@/lib/content-json-ld";
import { extractFaqFromBlogPost } from "@/lib/blog-faq";
import PackingList from "@/components/travel/PackingList";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

const SLUG = PATAGONIA_PACKING_LIST_SLUG;

const BANNED_PSEUDO_SOURCES = [
  "(т—ж)",
  "(т-ж)",
  "(trailo)",
  "(reddit)",
  "(hostelworld)",
  "(yeti tour)",
  "(tripadvisor)",
];

function allBlocks(sections: NonNullable<(typeof blogPosts)[number]["sections"]>): BlogBodyBlock[] {
  return sections.flatMap((section) => section.blocks ?? []);
}

describe("patagonia-packing-list rebuild", () => {
  const matches = blogPosts.filter((item) => item.slug === SLUG);
  const post = matches[0];

  it("exists exactly once as the single source of truth with approved SEO metadata", () => {
    expect(matches).toHaveLength(1);
    expect(post).toBeTruthy();
    expect(post!.title).toBe("Что взять в Патагонию: полный список вещей для путешествия");
    expect(post!.seoTitle).toBe("Что взять в Патагонию: одежда, обувь и полный чек-лист");
    expect(post!.seoDescription).toBe(PATAGONIA_PACKING_LIST_SEO_DESCRIPTION);
    expect(post!.excerpt).toBe(PATAGONIA_PACKING_LIST_EXCERPT);
    expect(post!.category).toBe("Патагония");
    expect(post!.date).toBe("2025-03-22");
    expect(post!.dateModified).toBe("2026-07-25");
    expect(post!.editorialReviewed).toBe(true);
  });

  it("has personal authorship by Ivan with Person JSON-LD", () => {
    expect(post!.author).toBe(BLOG_AUTHOR_IVAN.name);
    expect(post!.author).not.toBe(BLOG_EDITORIAL.name);
    expect(post!.authorRole).toBe(BLOG_AUTHOR_IVAN.role);
    expect(post!.authorUrl).toBe(BLOG_AUTHOR_IVAN.url);

    const jsonLd = buildBlogArticleJsonLd(post!) as {
      author?: { "@type"?: string; name?: string; url?: string; jobTitle?: string };
    };
    expect(jsonLd.author?.["@type"]).toBe("Person");
    expect(jsonLd.author?.name).toBe(BLOG_AUTHOR_IVAN.name);
    expect(jsonLd.author?.jobTitle).toBe(BLOG_AUTHOR_IVAN.role);
  });

  it("disables generic chrome that would compete with curated packing UX", () => {
    expect(post!.displayOptions).toEqual({
      showQuickFacts: false,
      showTopicCluster: false,
      showAffiliate: false,
      showDestinationGallery: false,
      autoLinkDestinations: false,
      showAutoSectionImages: false,
      showSidebarFresh: false,
    });
  });

  it("keeps TOC to at most 15 H2 sections without emoji titles", () => {
    expect(post!.sections?.length).toBeGreaterThan(0);
    expect(post!.sections!.length).toBeLessThanOrEqual(15);
    const emoji = /[\p{Extended_Pictographic}]/u;
    for (const section of post!.sections ?? []) {
      expect(emoji.test(section.title)).toBe(false);
    }
  });

  it("embeds story-deck without autoplay and packing-list widget", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const deck = blocks.find(
      (block): block is Extract<BlogBodyBlock, { type: "story-deck" }> =>
        block.type === "story-deck",
    );
    expect(deck).toBeTruthy();
    expect(deck!.slides).toHaveLength(6);
    expect(deck!.slides.some((slide) => slide.ctas?.some((cta) => cta.href.includes("итоговый-чек-лист")))).toBe(
      true,
    );

    const widgetKeys = blocks
      .filter((block): block is Extract<BlogBodyBlock, { type: "widget" }> => block.type === "widget")
      .map((block) => block.widgetKey);
    expect(widgetKeys).toContain("packing-list");
    expect(widgetKeys).toContain("layer-system");
    expect(widgetKeys).toContain("trip-type-selector");
    expect(widgetKeys).toContain("destination-packing-cards");
    expect(widgetKeys).toContain("summer-winter-comparison");
    expect(widgetKeys).toContain("what-not-to-pack");
    expect(widgetKeys).toContain("carry-on-packing");

    const deckSource = readFileSync(
      join(__dirname, "../components/blog/ArticleStoryDeck.tsx"),
      "utf8",
    );
    expect(deckSource).not.toMatch(/setInterval/);
    expect(deckSource).toMatch(/onTouchStart/);
  });

  it("renders packing checklist items in initial HTML for no-JS readers", () => {
    const html = renderToStaticMarkup(<PackingList />);
    expect(html).toContain("Термобельё");
    expect(html.length).toBeGreaterThan(500);
    // Multi-day autonomous gear stays out of the default city scenario markup labels list length,
    // but the component still ships a full progressive-enhancement list — assert essentials present.
    const essential = PATAGONIA_PACKING_ITEMS.find((item) => item.id.includes("shell") || item.label.includes("ветров"));
    expect(essential || PATAGONIA_PACKING_ITEMS.length > 20).toBeTruthy();
  });

  it("hides multi-day autonomous gear from the default tourist scenario data", () => {
    const multiDayOnly = PATAGONIA_PACKING_ITEMS.filter(
      (item) => item.advancedOnly || (item.scenarios.length === 1 && item.scenarios[0] === "multi-day"),
    );
    expect(multiDayOnly.length).toBeGreaterThan(0);
    for (const item of multiDayOnly) {
      expect(item.scenarios.includes("multi-day") || item.advancedOnly).toBe(true);
      expect(item.scenarios.includes("city")).toBe(false);
    }
  });

  it("keeps FAQ UI synchronized with FAQ JSON-LD extraction", () => {
    const faq = extractFaqFromBlogPost(post!);
    expect(faq.length).toBeGreaterThanOrEqual(8);
    const faqBlock = allBlocks(post!.sections ?? []).find(
      (block): block is Extract<BlogBodyBlock, { type: "faq" }> => block.type === "faq",
    );
    expect(faqBlock).toBeTruthy();
    expect(faqBlock!.items.length).toBe(faq.length);
    for (const item of faq) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps winter warnings and sources visible in HTML content", () => {
    const haystack = (post!.sections ?? []).map((section) => JSON.stringify(section)).join("\n");
    expect(haystack.toLowerCase()).toMatch(/зим/);
    expect(haystack).toMatch(/ручь/);
    expect(haystack).toMatch(/регистрац/);
    const sourceSections = post!.sections!.filter((s) => s.title.includes("Источники"));
    expect(sourceSections).toHaveLength(1);
    expect(sourceSections[0].body).toContain("argentina.gob.ar");
    expect(sourceSections[0].body).toContain("25 июля 2026");
  });

  it("does not reuse the article hero image inside body sections", () => {
    const haystack = JSON.stringify(post!.sections);
    expect(haystack).not.toContain(PATAGONIA_PACKING_MEDIA.hero.src);
  });

  it("records rights metadata for every packing media asset and avoids text PNGs", () => {
    for (const asset of Object.values(PATAGONIA_PACKING_MEDIA)) {
      expect(asset.src.endsWith(".png")).toBe(false);
      expect(asset.author.trim().length).toBeGreaterThan(0);
      expect(asset.sourceUrl.trim().length).toBeGreaterThan(0);
      expect(asset.license.trim().length).toBeGreaterThan(0);
      expect(asset.contentHash.trim().length).toBeGreaterThan(0);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
  });

  it("has a Patagonia-focused tour embed without insurance/eSIM titles", () => {
    const embeds = getBlogTourEmbeds(SLUG);
    expect(embeds).toBeTruthy();
    for (const embed of embeds ?? []) {
      expect(embed.title).not.toMatch(/страхование|esim|e-sim/i);
      if (embed.source.kind === "query") {
        expect(embed.source.query.toLowerCase()).toMatch(/patagonia/);
      }
    }
  });

  it("does not contain banned pseudo-sources or duplicate legacy official-sources wiring", () => {
    const haystack = (post!.sections ?? [])
      .map((section) => JSON.stringify(section))
      .join("\n")
      .toLowerCase();
    for (const phrase of BANNED_PSEUDO_SOURCES) {
      expect(haystack).not.toContain(phrase);
    }
    const blogTs = readFileSync(join(__dirname, "blog.ts"), "utf8");
    expect(blogTs).toContain("PATAGONIA_PACKING_LIST_POST");
    expect(blogTs).not.toMatch(/"patagonia-packing-list":\s*\n\s*"Проверено 17\.07\.2026/);
  });

  it("keeps internal related resources on valid local paths", () => {
    for (const resource of post!.relatedResources ?? []) {
      expect(resource.href.startsWith("/")).toBe(true);
      expect(resource.href.includes("blue-dollar")).toBe(false);
    }
  });
});
