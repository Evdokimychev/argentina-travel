import { describe, expect, it } from "vitest";
import { blogPostPlainText, contentPagePlainText, markdownToPlainText } from "@/lib/article-plain-text";
import { buildBlogArticleJsonLd, buildContentPageArticleJsonLd } from "@/lib/content-json-ld";
import type { BlogPost } from "@/types";
import type { ContentPage } from "@/types/content-page";

describe("article-plain-text", () => {
  it("strips markdown to plain text", () => {
    const plain = markdownToPlainText("# Заголовок\n\n**Жирный** текст и [ссылка](/guide).");
    expect(plain).toContain("Заголовок");
    expect(plain).toContain("Жирный");
    expect(plain).not.toContain("**");
    expect(plain).not.toContain("[");
  });

  it("joins blog post sections into article text", () => {
    const post = {
      excerpt: "Кратко",
      content: "Вступление",
      sections: [{ title: "Раздел", body: "Тело раздела" }],
    } as BlogPost;

    expect(blogPostPlainText(post)).toContain("Кратко");
    expect(blogPostPlainText(post)).toContain("Тело раздела");
  });

  it("joins content page sections into article text", () => {
    const page = {
      description: "Описание",
      sections: [{ heading: "Блок", paragraphs: ["Абзац один", "Абзац два"] }],
    } as ContentPage;

    expect(contentPagePlainText(page)).toContain("Описание");
    expect(contentPagePlainText(page)).toContain("Абзац два");
  });
});

describe("content-json-ld metrika", () => {
  it("builds blog article JSON-LD with text and BlogPosting", () => {
    const json = JSON.stringify(
      buildBlogArticleJsonLd({
        slug: "test",
        title: "Тест",
        excerpt: "Кратко",
        content: "Основной текст статьи.",
        author: "Редакция",
        date: "2026-01-01",
        category: "Путеводитель",
        tags: ["Аргентина"],
      } as BlogPost),
    );

    expect(json).toContain("BlogPosting");
    expect(json).toContain('"text":"');
    expect(json).toContain("#article");
  });

  it("builds guide/immigration article JSON-LD with text", () => {
    const json = JSON.stringify(
      buildContentPageArticleJsonLd({
        slug: "visa",
        section: "immigration",
        title: "Виза",
        description: "Справка",
        category: "Документы",
        updatedAt: "2026-02-01",
        sections: [{ paragraphs: ["Первый абзац материала."] }],
      } as ContentPage),
    );

    expect(json).toContain("Article");
    expect(json).toContain("Первый абзац материала.");
  });
});
