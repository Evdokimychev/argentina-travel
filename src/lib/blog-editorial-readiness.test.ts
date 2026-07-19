import { describe, expect, it } from "vitest";
import type { BlogPost } from "@/types";
import {
  getBlogEditorialIssues,
  isSensitiveBlogPost,
} from "./blog-editorial-readiness";

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: "test",
    slug: "patagonia-wind",
    title: "Погода в Патагонии",
    excerpt: "Практическое руководство.",
    content: "Проверяйте прогноз перед выходом.",
    author: "Редакция",
    date: "2026-07-17",
    dateModified: "2026-07-17",
    image: "/image.jpg",
    category: "Патагония",
    readTime: "5 минут",
    readTimeMinutes: 5,
    tags: [],
    editorialReviewed: true,
    ...overrides,
  };
}

describe("blog editorial readiness", () => {
  it("requires an official source and review date for sensitive public articles", () => {
    const sensitive = post({
      slug: "vnzh-argentina",
      category: "Иммиграция",
      dateModified: undefined,
    });

    expect(isSensitiveBlogPost(sensitive)).toBe(true);
    expect(getBlogEditorialIssues(sensitive).map((issue) => issue.code)).toEqual([
      "missing_review_date",
      "missing_official_source",
    ]);
  });

  it("accepts a dated sensitive article with a primary official source", () => {
    const sensitive = post({
      slug: "kak-menyat-dengi",
      category: "Деньги и обмен валют",
      content:
        "Проверено 17.07.2026. Источник: https://www.bcra.gob.ar/PublicacionesEstadisticas/",
    });

    expect(getBlogEditorialIssues(sensitive)).toEqual([]);
  });

  it("blocks public AI, development and pseudo-citation traces", () => {
    const unsafe = post({
      content: "Как языковая модель, TODO: сверить курс. Ориентир (Reddit).",
    });

    expect(getBlogEditorialIssues(unsafe).map((issue) => issue.code)).toEqual([
      "ai_trace",
      "development_trace",
      "pseudo_citation",
    ]);
  });

  it("does not mistake Spanish Todo proper names for development notes", () => {
    expect(
      getBlogEditorialIssues(
        post({ content: "Экскурсия Todo Glaciares и официальный обзор Todo Mendoza." }),
      ),
    ).toEqual([]);
  });
});
