import { describe, expect, it } from "vitest";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildOrganizationSchema,
  buildSiteSearchUrlTemplate,
  buildWebPageSchema,
  buildWebSiteSchema,
  organizationSchemaId,
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
    expect(JSON.stringify(schema)).toContain(organizationSchemaId("https://www.goargentina.ru/"));
  });

  it("builds site search URL template with slash before path", () => {
    expect(buildSiteSearchUrlTemplate("https://www.goargentina.ru")).toBe(
      "https://www.goargentina.ru/tours?query={search_term_string}",
    );
  });

  it("links WebSite publisher to Organization @id", () => {
    const siteUrl = "https://www.goargentina.ru/";
    const schema = buildWebSiteSchema({
      name: "Пора в Аргентину",
      url: siteUrl,
      searchUrlTemplate: buildSiteSearchUrlTemplate(siteUrl),
      publisherId: organizationSchemaId(siteUrl),
    });
    expect(JSON.stringify(schema)).toContain('"publisher":{"@id"');
    expect(JSON.stringify(schema)).toContain("/tours?query=");
  });

  it("builds WebPage with absolute url", () => {
    const schema = buildWebPageSchema({
      name: "Контакты",
      description: "Связаться с нами",
      path: "/contacts",
    });
    expect(schema.url).toContain("/contacts");
  });

  it("builds breadcrumb list positions with absolute item urls", () => {
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
    expect(JSON.stringify(schema)).toContain("https://");
    expect(JSON.stringify(schema)).toContain("/blog");
  });

  it("builds article schema with absolute image url", () => {
    const schema = buildArticleSchema({
      title: "Игуасу",
      description: "Гид",
      path: "/blog/iguazu",
      text: "Полный текст статьи про водопады Игуасу.",
      image: "/media/blog/test/hero.jpg",
      datePublished: "2026-01-01",
      authorName: "Редакция",
    });
    expect(schema.image).toBe("https://www.goargentina.ru/media/blog/test/hero.jpg");
  });

  it("builds article schema for Yandex content analytics", () => {
    const schema = buildArticleSchema({
      title: "Игуасу",
      description: "Гид",
      path: "/blog/iguazu",
      text: "Полный текст статьи про водопады Игуасу.",
      datePublished: "2026-01-01",
      authorName: "Редакция",
      schemaType: "BlogPosting",
    });
    expect(schema.headline).toBe("Игуасу");
    const json = JSON.stringify(schema);
    expect(json).toContain("BlogPosting");
    expect(json).toContain('"text":"');
    expect(json).toContain("#article");
  });

  it("builds blog article schema with speakable when enabled", () => {
    const schema = buildArticleSchema({
      title: "Игуасу",
      description: "Гид",
      path: "/blog/iguazu",
      text: "Полный текст статьи.",
      datePublished: "2026-01-01",
      authorName: "Редакция",
      schemaType: "BlogPosting",
      speakable: true,
    });
    expect(JSON.stringify(schema)).toContain("SpeakableSpecification");
  });

  it("builds article schema without speakable by default", () => {
    const schema = buildArticleSchema({
      title: "Виза",
      description: "Справка",
      path: "/immigration/visa",
      text: "Текст материала про визу.",
      authorName: "Редакция",
    });
    expect(JSON.stringify(schema)).not.toContain("SpeakableSpecification");
  });

  it("serializes to JSON string", () => {
    const json = serializeJsonLd(
      buildWebPageSchema({ name: "Test", description: "Desc", path: "/test" })
    );
    expect(json).toContain('"@type":"WebPage"');
  });
});
