import { describe, expect, it } from "vitest";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildOrganizationSchema,
  buildWebPageSchema,
  serializeJsonLd,
} from "@/lib/schema-json-ld";

describe("schema-json-ld", () => {
  it("builds Organization with context", () => {
    const schema = buildOrganizationSchema({
      name: "Пора в Аргентину",
      url: "https://www.goargentina.ru/",
      logoUrl: "https://www.goargentina.ru/logo-light.svg",
    });
    expect(schema["@context"]).toBe("https://schema.org");
    expect(JSON.stringify(schema)).toContain("Organization");
  });

  it("builds WebPage with absolute url", () => {
    const schema = buildWebPageSchema({
      name: "Контакты",
      description: "Связаться с нами",
      path: "/contacts",
    });
    expect(schema.url).toContain("/contacts");
  });

  it("builds breadcrumb list positions", () => {
    const schema = buildBreadcrumbListSchema([
      { name: "Главная", path: "/" },
      { name: "Блог", path: "/blog" },
    ]);
    const items = Array.isArray(schema.itemListElement)
      ? schema.itemListElement
      : schema.itemListElement
        ? [schema.itemListElement]
        : [];
    expect(items).toHaveLength(2);
    expect(JSON.stringify(schema)).toContain('"position":2');
  });

  it("builds article schema with absolute image url", () => {
    const schema = buildArticleSchema({
      title: "Игуасу",
      excerpt: "Гид",
      slug: "iguazu",
      image: "/media/blog/test/hero.jpg",
      datePublished: "2026-01-01",
      authorName: "Редакция",
    });
    expect(schema.image).toBe("https://www.goargentina.ru/media/blog/test/hero.jpg");
  });

  it("builds article schema", () => {
    const schema = buildArticleSchema({
      title: "Игуасу",
      excerpt: "Гид",
      slug: "iguazu",
      datePublished: "2026-01-01",
      authorName: "Редакция",
    });
    expect(schema.headline).toBe("Игуасу");
    expect(JSON.stringify(schema)).toContain("Article");
    expect(JSON.stringify(schema)).toContain("SpeakableSpecification");
    expect(JSON.stringify(schema)).toContain("data-speakable");
  });

  it("serializes to JSON string", () => {
    const json = serializeJsonLd(
      buildWebPageSchema({ name: "Test", description: "Desc", path: "/test" })
    );
    expect(json).toContain('"@type":"WebPage"');
  });
});
