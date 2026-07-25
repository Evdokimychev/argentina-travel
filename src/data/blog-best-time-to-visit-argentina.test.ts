import { describe, expect, it } from "vitest";
import { blogPosts } from "@/data/blog";
import {
  ARGENTINA_SEASON_MATRIX,
  SEASON_SCORE_LABELS,
} from "@/data/argentina-season-matrix";
import { BLOG_AUTHOR_IVAN } from "@/data/blog-author-ivan";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { buildBlogArticleJsonLd } from "@/lib/content-json-ld";
import { extractFaqFromBlogPost } from "@/lib/blog-faq";
import { getTypedBlocksForSection } from "@/data/blog-typed-blocks";
import { getBlogTourEmbeds } from "@/data/blog-tour-embeds";

const SLUG = "best-time-to-visit-argentina";

describe("best-time-to-visit-argentina rebuild", () => {
  const post = blogPosts.find((item) => item.slug === SLUG);

  it("is a single SSOT post with Ivan authorship and display options", () => {
    expect(post).toBeTruthy();
    expect(post!.title).toBe(
      "Когда лучше ехать в Аргентину: сезоны, регионы и календарь поездки",
    );
    expect(post!.seoTitle).toBe("Когда лучше ехать в Аргентину: сезоны и погода по месяцам");
    expect(post!.seoDescription).toContain("Погода по месяцам");
    expect(post!.author).toBe(BLOG_AUTHOR_IVAN.name);
    expect(post!.authorAvatar).toBeUndefined();
    expect(post!.author).not.toBe(BLOG_EDITORIAL.name);
    expect(post!.date).toBe("2025-05-15");
    expect(post!.dateModified).toBe("2026-07-25");
    expect(post!.editorialReviewed).toBe(true);
    expect(post!.displayOptions).toEqual({
      showQuickFacts: false,
      showTopicCluster: false,
      showAffiliate: false,
      showDestinationGallery: false,
    });
    expect(post!.sections?.some((s) => s.title === "Источники и дата проверки")).toBe(true);
    expect(
      post!.sections?.filter((s) => s.title === "Источники и дата проверки"),
    ).toHaveLength(1);
    expect(post!.content).toContain("Проверено 25.07.2026");
  });

  it("has no legacy typed-block override and no tour embeds", () => {
    expect(getTypedBlocksForSection(SLUG, "Краткий ответ по целям поездки")).toBeUndefined();
    expect(getBlogTourEmbeds(SLUG)).toBeUndefined();
    expect(post!.tourEmbeds ?? []).toEqual([]);
  });

  it("exposes eight FAQ items in UI source and Person JSON-LD without editorial avatar", () => {
    const faq = extractFaqFromBlogPost(post!);
    expect(faq).toHaveLength(8);
    const jsonLd = buildBlogArticleJsonLd(post!) as {
      author?: { "@type"?: string; name?: string; image?: string };
    };
    expect(jsonLd.author?.["@type"]).toBe("Person");
    expect(jsonLd.author?.name).toBe(BLOG_AUTHOR_IVAN.name);
    expect(jsonLd.author?.image).toBeUndefined();
  });

  it("season matrix has no Uruguay and uses Russian season labels", () => {
    expect(ARGENTINA_SEASON_MATRIX.some((row) => /уругв/i.test(row.name))).toBe(false);
    expect(Object.values(SEASON_SCORE_LABELS)).toEqual([
      "Только для конкретной цели/при проверке условий",
      "Хорошо с оговорками",
      "Основной сезон",
    ]);
    const valdes = ARGENTINA_SEASON_MATRIX.find((row) => row.id === "valdes");
    expect(valdes?.summary).toMatch(/июня до начала декабря/i);
    expect(valdes?.summary).toMatch(/середины сентября/i);
  });
});
