import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";
import { BLOG_AUTHOR_IVAN } from "@/data/blog-author-ivan";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { buildBlogArticleJsonLd } from "@/lib/content-json-ld";
import { extractFaqFromBlogPost } from "@/lib/blog-faq";
import { getBlogTourEmbeds } from "@/data/blog-tour-embeds";
import { resolveBlogCanonicalTarget } from "@/data/blog-canonical-map";
import { STEAK_CUT_OPTIONS } from "@/data/steak-cut-selector";
import { STEAK_DONENESS_ITEMS } from "@/data/steak-doneness-phrases";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

const SLUG = "argentinian-steak-guide";

// Direct mistranslations/claims the rebuild must not reintroduce as fact statements.
// "с кровью" may still appear once, only inside the explicit correction
// ("не переводите jugoso как «с кровью»") — never as a standalone equivalence/label.
const BANNED_EQUIVALENCE_PHRASES = [
  "jugoso — с кровью",
  "jugoso\tс кровью",
  "самый безопасный вариант — a punto",
  "самый безопасный вариант для туриста",
  "10–20 usd",
  "20–40 usd",
  "50 usd и выше",
];

function allBlocks(sections: NonNullable<(typeof blogPosts)[number]["sections"]>): BlogBodyBlock[] {
  return sections.flatMap((section) => section.blocks ?? []);
}

describe("argentinian-steak-guide rebuild", () => {
  const matches = blogPosts.filter((item) => item.slug === SLUG);
  const post = matches[0];

  it("exists exactly once as a public post with the approved metadata", () => {
    expect(matches).toHaveLength(1);
    expect(post).toBeTruthy();
    expect(post!.title).toBe(
      "Аргентинские стейки: отрубы, прожарка и как заказать в parrilla",
    );
    expect(post!.seoTitle).toBe("Аргентинские стейки: отрубы, прожарка и заказ в parrilla");
    expect(post!.seoDescription).toContain("Bife de chorizo");
    expect(post!.excerpt).toContain("Практический гид");
    expect(post!.category).toBe("Кухня Аргентины");
    expect(post!.date).toBe("2025-04-28");
    expect(post!.dateModified).toBe("2026-07-25");
    expect(post!.editorialReviewed).toBe(true);
  });

  it("has personal authorship by Ivan with role, url and Person JSON-LD", () => {
    expect(post!.author).toBe(BLOG_AUTHOR_IVAN.name);
    expect(post!.author).not.toBe(BLOG_EDITORIAL.name);
    expect(post!.authorRole).toBe(BLOG_AUTHOR_IVAN.role);
    expect(post!.authorUrl).toBe(BLOG_AUTHOR_IVAN.url);
    expect(post!.authorAvatar).toBeUndefined();

    const jsonLd = buildBlogArticleJsonLd(post!) as {
      author?: { "@type"?: string; name?: string; url?: string; jobTitle?: string };
    };
    expect(jsonLd.author?.["@type"]).toBe("Person");
    expect(jsonLd.author?.name).toBe(BLOG_AUTHOR_IVAN.name);
    expect(jsonLd.author?.url).toContain(BLOG_AUTHOR_IVAN.url);
    expect(jsonLd.author?.jobTitle).toBe(BLOG_AUTHOR_IVAN.role);
  });

  it("has the required display options disabled", () => {
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

  it("keeps the TOC to at most 15 top-level H2 sections", () => {
    expect(post!.sections?.length).toBeGreaterThan(0);
    expect(post!.sections!.length).toBeLessThanOrEqual(15);
  });

  it("does not promote individual cuts to their own H2 sections", () => {
    const cutNames = [
      "Bife de chorizo",
      "Ojo de bife",
      "Lomo",
      "Entraña",
      "Vacío",
      "Asado de tira",
      "Colita de cuadril",
      "Matambre",
    ];
    for (const cut of cutNames) {
      expect(post!.sections!.some((section) => section.title.trim() === cut)).toBe(false);
    }
    const cutsSection = post!.sections!.find((s) => s.title === "Основные аргентинские отрубы");
    expect(cutsSection).toBeTruthy();
    for (const cut of cutNames) {
      expect(cutsSection!.body).toContain(`### ${cut}`);
    }
  });

  it("has no emoji in H2 section titles", () => {
    const emoji = /[\p{Extended_Pictographic}]/u;
    for (const section of post!.sections ?? []) {
      expect(emoji.test(section.title)).toBe(false);
    }
  });

  it("does not contain banned equivalence phrases or stale fixed USD prices", () => {
    const haystack = (post!.sections ?? [])
      .map((section) => JSON.stringify(section))
      .join(" \n ")
      .toLowerCase();
    for (const phrase of BANNED_EQUIVALENCE_PHRASES) {
      expect(haystack).not.toContain(phrase);
    }
    // "с кровью" may only appear as part of the explicit editorial correction.
    const bloodMentions = haystack.split("с кровью").length - 1;
    expect(bloodMentions).toBeLessThanOrEqual(1);
    if (bloodMentions === 1) {
      expect(haystack).toContain("не переводите `jugoso` как «с кровью»");
    }
    // The doneness widget data must never label jugoso's meaning as "blood".
    for (const item of STEAK_DONENESS_ITEMS) {
      expect(item.meaning.toLowerCase()).not.toContain("с кровью");
      expect(item.caveat.toLowerCase()).not.toContain("с кровью");
    }
  });

  it("embeds the cut selector and doneness phrasebook widgets with data in initial HTML", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const widgetKeys = blocks
      .filter((block): block is Extract<BlogBodyBlock, { type: "widget" }> => block.type === "widget")
      .map((block) => block.widgetKey);
    expect(widgetKeys).toContain("steak-cut-selector");
    expect(widgetKeys).toContain("steak-doneness-phrases");
    expect(STEAK_CUT_OPTIONS.length).toBeGreaterThanOrEqual(5);
    expect(STEAK_DONENESS_ITEMS.length).toBe(5);
  });

  it("has a decision comparison-table with mobile card layout for the first-time choice", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const comparisonTable = blocks.find(
      (block): block is Extract<BlogBodyBlock, { type: "comparison-table" }> =>
        block.type === "comparison-table",
    );
    expect(comparisonTable).toBeTruthy();
    expect(comparisonTable!.mobileLayout).toBe("cards");
    expect(comparisonTable!.rows.length).toBeGreaterThanOrEqual(5);
  });

  it("exposes FAQ items in UI blocks that match the JSON-LD extraction", () => {
    const faq = extractFaqFromBlogPost(post!);
    expect(faq.length).toBeGreaterThanOrEqual(8);
    for (const item of faq) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it("has a single sources section and no fabricated ratings", () => {
    const sourceSections = post!.sections!.filter((s) => s.title.includes("Источники и дата проверки"));
    expect(sourceSections).toHaveLength(1);
    expect(sourceSections[0].body).toContain("Argentina.gob.ar");
    expect(sourceSections[0].body).toContain("IPCVA");
  });

  it("has a precise, non-generic tour embed query (not the old broad 'buenos' query)", () => {
    const embeds = getBlogTourEmbeds(SLUG);
    expect(embeds).toBeTruthy();
    for (const embed of embeds ?? []) {
      if (embed.source.kind === "query") {
        expect(embed.source.query.trim().toLowerCase()).not.toBe("buenos");
        expect(embed.source.query.toLowerCase()).toMatch(/asado|parrilla|gastronomy|food/);
      }
      expect(embed.title).not.toMatch(/страхование|esim|e-sim/i);
    }
    // The merged catalog attaches the same fallback embeds (no insurance/eSIM present).
    for (const embed of post!.tourEmbeds ?? []) {
      expect(embed.title).not.toMatch(/страхование|esim|e-sim/i);
    }
  });

  it("has relevant related resources and quarantines the blue-dollar link", () => {
    const hrefs = (post!.relatedResources ?? []).map((r) => r.href);
    expect(hrefs).toContain("/guide/kukhnya");
    expect(hrefs).toContain("/destinations/ba");
    expect(hrefs).toContain("/blog/buenos-aires-rajony");
    expect(hrefs).toContain("/about");
    expect(hrefs.some((href) => href.includes("blue-dollar"))).toBe(false);
  });

  it("keeps the canonical map title for food-asado in sync with the new H1", () => {
    const canonical = resolveBlogCanonicalTarget("food-asado");
    expect(canonical?.canonicalSlug).toBe(SLUG);
    expect(canonical?.canonicalTitle).toBe(post!.title);
  });

  it("no longer carries legacy manual official-sources or section overrides for this slug", () => {
    const raw = readFileSync(join(process.cwd(), "src/data/blog.ts"), "utf8");
    const officialSourcesBlock = raw.slice(
      raw.indexOf("const legacyManualOfficialSources"),
      raw.indexOf("const legacyManualSectionOverrides"),
    );
    expect(officialSourcesBlock).not.toContain(SLUG);

    const overridesBlock = raw.slice(raw.indexOf("const legacyManualSectionOverrides"));
    expect(overridesBlock.slice(0, overridesBlock.indexOf("\n};"))).not.toContain(SLUG);
  });
});
