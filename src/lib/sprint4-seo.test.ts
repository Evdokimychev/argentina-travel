import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildArticleSchema } from "@/lib/schema-json-ld";

describe("Sprint 4 SEO and performance", () => {
  it("article JSON-LD uses absolute image URLs", () => {
    const schema = buildArticleSchema({
      title: "Test",
      excerpt: "Excerpt",
      slug: "test-slug",
      image: "/media/blog/sample/hero.jpg",
      datePublished: "2026-01-01",
      authorName: "Редакция",
    });
    expect(schema.image).toMatch(/^https:\/\//);
  });

  it("contacts page exports full public metadata", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/contacts/page.tsx"), "utf8");
    expect(source).toMatch(/buildPublicPageMetadata/);
    expect(source).toMatch(/alternates: buildHreflangAlternates/);
  });

  it("BlogRichArticle is a server component shell", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/blog/BlogRichArticle.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/^"use client"/m);
    expect(source).toMatch(/BlogRichArticleClientBlock/);
  });

  it("BlogRichArticle uses server-safe rich block guard", () => {
    const article = readFileSync(
      resolve(process.cwd(), "src/components/blog/BlogRichArticle.tsx"),
      "utf8",
    );
    expect(article).toMatch(/@\/lib\/blog-rich-client-blocks/);
    expect(article).not.toMatch(/isBlogRichClientBlock[\s\S]*BlogRichArticleClientBlocks/);
  });

  it("blog index page does not mutate cookies during RSC render", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/blog/page.tsx"), "utf8");
    expect(source).not.toMatch(/cookieStore\.set\(/);
  });

  it("CI runs lighthouse without SKIP_LIGHTHOUSE", () => {
    const ci = readFileSync(resolve(process.cwd(), ".github/workflows/ci.yml"), "utf8");
    expect(ci).toMatch(/lighthouse-ci\.mjs/);
    expect(ci).not.toMatch(/SKIP_LIGHTHOUSE/);
  });

  it("organizer tour seeds avoid Unsplash hotlinks", () => {
    const source = readFileSync(resolve(process.cwd(), "src/data/organizer-tours.ts"), "utf8");
    expect(source).not.toMatch(/unsplash\.com/);
    expect(source).toMatch(/getTourCoverImage/);
  });
});
