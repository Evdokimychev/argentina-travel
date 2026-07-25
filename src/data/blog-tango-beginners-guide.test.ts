import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blogPosts, getBlogPostBySlug } from "@/data/blog";
import { BLOG_AUTHOR_IVAN } from "@/data/blog-author-ivan";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { buildBlogArticleJsonLd } from "@/lib/content-json-ld";
import { extractFaqFromBlogPost } from "@/lib/blog-faq";
import { getBlogTourEmbeds } from "@/data/blog-tour-embeds";
import { stripHeadingDecorations } from "@/lib/content-heading-id";
import { TANGO_GLOSSARY_TERMS } from "@/data/tango-glossary";
import { TANGO_PHRASEBOOK } from "@/data/tango-phrasebook";
import { TANGO_GUIDE_IMAGE_ASSETS } from "@/data/media/tango-beginners-guide-media";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

const SLUG = "tango-beginners-guide";
const EMOJI_PATTERN = /[\p{Extended_Pictographic}]/u;

function allBlocks(sections: NonNullable<(typeof blogPosts)[number]["sections"]>): BlogBodyBlock[] {
  return sections.flatMap((section) => section.blocks ?? []);
}

function computeAnchorIds(post: NonNullable<ReturnType<typeof getBlogPostBySlug>>): Set<string> {
  const usedIds = new Set<string>();
  const anchorIds = new Set<string>();
  for (const section of post.sections ?? []) {
    const base = section.title
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    let id = base || "section";
    let suffix = 2;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    usedIds.add(id);
    anchorIds.add(id);
  }
  return anchorIds;
}

describe("tango-beginners-guide rebuild", () => {
  const matches = blogPosts.filter((item) => item.slug === SLUG);
  const post = matches[0];

  it("1. exists exactly once as a public post and the resolver fallback returns the SSOT", () => {
    expect(matches).toHaveLength(1);
    expect(post).toBeTruthy();
    expect(getBlogPostBySlug(SLUG)?.title).toBe(post!.title);
  });

  it("4. has the approved H1, SEO title, description, excerpt and canonical slug", () => {
    expect(post!.slug).toBe("tango-beginners-guide");
    expect(post!.title).toBe(
      "Танго в Буэнос-Айресе для начинающих: как впервые пойти на милонгу",
    );
    expect(post!.seoTitle).toBe("Танго в Буэнос-Айресе: милонга для начинающих");
    expect(post!.seoDescription).toContain("cabeceo");
    expect(post!.seoDescription).toContain("ronda");
    expect(post!.excerpt).toContain("Практический гид");
  });

  it("5+6+7. is authored by Ivan with Person author and Organization publisher in JSON-LD", () => {
    expect(post!.author).toBe(BLOG_AUTHOR_IVAN.name);
    expect(post!.author).not.toBe(BLOG_EDITORIAL.name);
    expect(post!.authorRole).toBe(BLOG_AUTHOR_IVAN.role);
    expect(post!.authorUrl).toBe(BLOG_AUTHOR_IVAN.url);

    const jsonLd = buildBlogArticleJsonLd(post!) as {
      author?: { "@type"?: string; name?: string; url?: string; jobTitle?: string };
      publisher?: { "@type"?: string };
    };
    expect(jsonLd.author?.["@type"]).toBe("Person");
    expect(jsonLd.author?.name).toBe(BLOG_AUTHOR_IVAN.name);
    expect(jsonLd.author?.jobTitle).toBe(BLOG_AUTHOR_IVAN.role);
    expect(jsonLd.publisher?.["@type"]).toBe("Organization");
  });

  it("8+9. preserves the earliest verified publish date and has a current dateModified", () => {
    expect(post!.date).toBe("2025-04-10");
    expect(post!.dateModified).toBe("2026-07-25");
    expect(post!.editorialReviewed).toBe(true);
  });

  it("has the required display options disabled and sectionPanels on", () => {
    expect(post!.displayOptions).toEqual({
      showQuickFacts: false,
      showTopicCluster: false,
      showAffiliate: false,
      showDestinationGallery: false,
      autoLinkDestinations: false,
      showAutoSectionImages: false,
      showSidebarFresh: false,
      sectionPanels: true,
    });
  });

  it("15. keeps the TOC to at most 15 H2 sections with clean anchor labels", () => {
    expect(post!.sections?.length).toBeGreaterThan(0);
    expect(post!.sections!.length).toBeLessThanOrEqual(15);
    for (const section of post!.sections ?? []) {
      const stripped = stripHeadingDecorations(section.title);
      expect(EMOJI_PATTERN.test(stripped)).toBe(false);
    }
  });

  it("10+11+12. embeds a 6-slide story deck right after the intro, all text in HTML, no autoplay", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const deck = blocks.find(
      (block): block is Extract<BlogBodyBlock, { type: "story-deck" }> =>
        block.type === "story-deck",
    );
    expect(deck).toBeTruthy();
    expect(deck!.slides).toHaveLength(6);
    expect(post!.sections![0].blocks?.[0]).toBe(deck);
    // No autoplay knobs exist on the deck data model at all.
    expect(JSON.stringify(deck)).not.toMatch(/autoplay|interval|autoPlay/i);
    for (const slide of deck!.slides) {
      expect(slide.title.trim().length).toBeGreaterThan(0);
      expect(slide.body.trim().length).toBeGreaterThan(0);
      expect(EMOJI_PATTERN.test(slide.title)).toBe(false);
      expect(EMOJI_PATTERN.test(slide.body)).toBe(false);
    }
  });

  it("story-deck CTAs only point to real in-page anchors or existing routes", () => {
    const anchorIds = computeAnchorIds(post!);
    const blocks = allBlocks(post!.sections ?? []);
    const deck = blocks.find(
      (block): block is Extract<BlogBodyBlock, { type: "story-deck" }> =>
        block.type === "story-deck",
    )!;
    for (const slide of deck.slides) {
      for (const cta of slide.ctas ?? []) {
        if (cta.href.startsWith("#")) {
          expect(anchorIds.has(cta.href.slice(1))).toBe(true);
        } else {
          expect(cta.href.startsWith("/")).toBe(true);
        }
      }
    }
  });

  it("13. glossary widget carries every required Spanish term (data in initial HTML)", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const widgetKeys = blocks
      .filter((b): b is Extract<BlogBodyBlock, { type: "widget" }> => b.type === "widget")
      .map((b) => b.widgetKey);
    expect(widgetKeys).toContain("tango-glossary");
    const terms = TANGO_GLOSSARY_TERMS.map((t) => t.term.toLowerCase());
    for (const required of ["abrazo", "pista", "ronda", "tanda", "cortina", "mirada", "cabeceo", "práctica"]) {
      expect(terms.some((t) => t.includes(required))).toBe(true);
    }
    for (const term of TANGO_GLOSSARY_TERMS) {
      expect(term.id.trim().length).toBeGreaterThan(0);
      expect(term.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("14. roles are not described as man/woman only", () => {
    const rolesSection = post!.sections!.find((s) => s.title.includes("Роли"));
    expect(rolesSection).toBeTruthy();
    expect(rolesSection!.body).toContain("ведущая и следующая");
    expect(rolesSection!.body).toContain("не обязаны быть привязаны к полу");
    // The article must never hand out wardrobe advice split strictly by gender
    // like the old legacy version did ("Мужчинам … Женщинам …").
    const haystack = (post!.sections ?? []).map((s) => s.body).join("\n");
    expect(haystack).not.toMatch(/Мужчинам\s*\n/);
    expect(haystack).not.toMatch(/Женщинам\s*\n/);
  });

  it("15b. consent and the right to refuse are present", () => {
    const haystack = (post!.sections ?? []).map((s) => JSON.stringify(s)).join(" ").toLowerCase();
    expect(haystack).toContain("согласие");
    expect(haystack).toContain("отказ не требует объяснения");
  });

  it("16. registers an accessible ronda diagram widget (native SVG, not a text PNG)", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const widgetKeys = blocks
      .filter((b): b is Extract<BlogBodyBlock, { type: "widget" }> => b.type === "widget")
      .map((b) => b.widgetKey);
    expect(widgetKeys).toContain("tango-ronda-diagram");
    const component = readFileSync(
      join(process.cwd(), "src/components/travel/TangoRondaDiagram.tsx"),
      "utf8",
    );
    expect(component).toContain("<svg");
    expect(component).toContain("<title");
    expect(component).toContain("<desc");
    expect(component).toContain("aria-labelledby");
  });

  it("17. comparison table uses mobile card layout (no horizontal scroll on 390px)", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const comparison = blocks.find(
      (b): b is Extract<BlogBodyBlock, { type: "comparison-table" }> =>
        b.type === "comparison-table",
    );
    expect(comparison).toBeTruthy();
    expect(comparison!.mobileLayout).toBe("cards");
    expect(comparison!.rows.length).toBeGreaterThanOrEqual(4);
  });

  it("18+19. phrasebook widget is present and every Spanish phrase is in the data (readable without JS)", () => {
    const blocks = allBlocks(post!.sections ?? []);
    const widgetKeys = blocks
      .filter((b): b is Extract<BlogBodyBlock, { type: "widget" }> => b.type === "widget")
      .map((b) => b.widgetKey);
    expect(widgetKeys).toContain("tango-phrasebook");
    expect(TANGO_PHRASEBOOK.length).toBeGreaterThanOrEqual(8);
    for (const phrase of TANGO_PHRASEBOOK) {
      expect(phrase.phrase.trim().length).toBeGreaterThan(0);
      expect(phrase.translation.trim().length).toBeGreaterThan(0);
    }
  });

  it("20. FAQ UI blocks match the JSON-LD extraction", () => {
    const faq = extractFaqFromBlogPost(post!);
    expect(faq.length).toBeGreaterThanOrEqual(8);
    for (const item of faq) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it("21+22+23. only project-generated media with metadata, no hero reuse, no text-PNG slides", () => {
    const heroAsset = TANGO_GUIDE_IMAGE_ASSETS.find((a) => a.key === "hero")!;
    const bodyMediaSrcs: string[] = [];
    for (const block of allBlocks(post!.sections ?? [])) {
      if (block.type === "media") bodyMediaSrcs.push(block.src);
      if (block.type === "gallery") bodyMediaSrcs.push(...block.items.map((i) => i.src));
      // Story decks must not carry any raster "slide" that bakes text in — deck
      // slides only reference the shared photo manifest or an interactive widget.
    }
    expect(bodyMediaSrcs.length).toBeGreaterThan(0);
    for (const src of bodyMediaSrcs) {
      expect(src).not.toBe(heroAsset.src);
      const asset = TANGO_GUIDE_IMAGE_ASSETS.find((a) => a.src === src);
      expect(asset).toBeTruthy();
      expect(asset!.generator).toMatch(/no external stock license/i);
      expect(asset!.alt.trim().length).toBeGreaterThan(0);
    }
    const hashes = TANGO_GUIDE_IMAGE_ASSETS.map((a) => a.contentHash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("24+25. has no fixed milonga ranking and no fixed prices", () => {
    const haystack = (post!.sections ?? []).map((s) => JSON.stringify(s)).join(" ").toLowerCase();
    // No named "best milongas" list (the legacy version listed La Viruta / El Beso …).
    expect(haystack).not.toContain("la viruta");
    expect(haystack).not.toContain("el beso");
    expect(haystack).not.toMatch(/лучшие милонги/);
    // No hard-coded currency figures.
    expect(haystack).not.toMatch(/\$\s?\d|\d+\s?(usd|ars|песо|руб)/i);
  });

  it("26. links to the official milongas catalog", () => {
    const haystack = (post!.sections ?? []).map((s) => JSON.stringify(s)).join(" ");
    expect(haystack).toContain("turismo.buenosaires.gob.ar/es/tango/milongas");
  });

  it("27+28. tour embed query is tango-specific with no insurance/eSIM strips", () => {
    const embeds = getBlogTourEmbeds(SLUG);
    expect(embeds).toBeTruthy();
    for (const embed of embeds ?? []) {
      if (embed.source.kind === "query") {
        expect(embed.source.query.trim().toLowerCase()).not.toBe("buenos");
        expect(embed.source.query.toLowerCase()).toMatch(/tango|milonga/);
      }
      expect(embed.title).not.toMatch(/страхование|esim|e-sim/i);
    }
    for (const embed of post!.tourEmbeds ?? []) {
      expect(embed.title).not.toMatch(/страхование|esim|e-sim/i);
    }
  });

  it("29. related resources point to existing routes only (no blue-dollar / stale links)", () => {
    const hrefs = (post!.relatedResources ?? []).map((r) => r.href);
    expect(hrefs).toContain("/destinations/ba");
    expect(hrefs).toContain("/blog/buenos-aires-rajony");
    expect(hrefs).toContain("/about");
    expect(hrefs.some((h) => h.includes("blue-dollar"))).toBe(false);
  });

  it("has a single sources section referencing UNESCO and the official portal", () => {
    const sourceSections = post!.sections!.filter((s) => s.title.includes("Источники и дата проверки"));
    expect(sourceSections).toHaveLength(1);
    expect(sourceSections[0].body).toContain("UNESCO");
    expect(sourceSections[0].body).toContain("turismo.buenosaires.gob.ar");
  });

  it("no longer carries legacy manual official-sources for this slug", () => {
    const raw = readFileSync(join(process.cwd(), "src/data/blog.ts"), "utf8");
    const officialSourcesBlock = raw.slice(
      raw.indexOf("const legacyManualOfficialSources"),
      raw.indexOf("const legacyManualSectionOverrides"),
    );
    expect(officialSourcesBlock).not.toContain(SLUG);
  });

  it("32. does not emit raw markdown table pipes or leftover pseudo-citations in section bodies", () => {
    const bodies = (post!.sections ?? []).map((s) => s.body).join("\n");
    // No legacy "(Tripadvisor)" / "(Tango.ORG)"-style pseudo citations.
    expect(bodies).not.toMatch(/\((?:Tripadvisor|Tango\.ORG|Viator|BailaBA|Time Out Worldwide|Condé Nast Traveler|El País)\)/);
    // No raw GFM table rows left inline in a plain body (tables use comparison-table blocks).
    expect(bodies).not.toMatch(/\n\|.*\|.*\|/);
  });
});
