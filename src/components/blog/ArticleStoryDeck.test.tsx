import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ArticleStoryDeck from "./ArticleStoryDeck";
import type { StoryDeckSlide } from "@/types/blog-content-blocks";

const slides: StoryDeckSlide[] = Array.from({ length: 7 }, (_, i) => ({
  id: `slide-${i + 1}`,
  title: `Заголовок карточки ${i + 1}`,
  body: `Текст карточки номер ${i + 1} для проверки рендера.`,
  bullets: [`Пункт A ${i + 1}`, `Пункт B ${i + 1}`],
  ctas: [{ label: `Перейти ${i + 1}`, href: `#anchor-${i + 1}` }],
  icon: "BookOpen",
}));

describe("ArticleStoryDeck", () => {
  it("renders all 7 slides' titles and bodies in the initial (pre-hydration) HTML", () => {
    const html = renderToStaticMarkup(
      <ArticleStoryDeck
        title="Главное за 7 карточек"
        ariaLabel="Краткий обзор"
        slides={slides}
      />,
    );

    for (const slide of slides) {
      expect(html).toContain(slide.title);
      expect(html).toContain(slide.body);
      for (const bullet of slide.bullets ?? []) {
        expect(html).toContain(bullet);
      }
    }
  });

  it("does not render carousel chrome (prev/next/dots) before mount — no isolated dead controls", () => {
    const html = renderToStaticMarkup(
      <ArticleStoryDeck
        title="Главное за 7 карточек"
        ariaLabel="Краткий обзор"
        slides={slides}
      />,
    );
    expect(html).not.toContain("Предыдущая карточка");
    expect(html).not.toContain("Следующая карточка");
  });

  it("carries the carousel a11y role and a real, translated aria label", () => {
    const html = renderToStaticMarkup(
      <ArticleStoryDeck
        title="Главное за 7 карточек"
        ariaLabel="Краткий обзор гида в 7 карточках"
        slides={slides}
      />,
    );
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain("Краткий обзор гида в 7 карточках");
  });

  it("returns null for an empty slide list instead of rendering an empty shell", () => {
    const html = renderToStaticMarkup(
      <ArticleStoryDeck title="Пусто" ariaLabel="Пусто" slides={[]} />,
    );
    expect(html).toBe("");
  });

  it("has no autoplay timers and does implement keyboard/swipe navigation in source", () => {
    const source = readFileSync(join(__dirname, "ArticleStoryDeck.tsx"), "utf8");
    expect(source).not.toMatch(/setInterval/);
    expect(source).toMatch(/ArrowLeft/);
    expect(source).toMatch(/ArrowRight/);
    expect(source).toMatch(/onTouchStart/);
    expect(source).toMatch(/onTouchEnd/);
    expect(source).toMatch(/aria-live/);
    expect(source).toMatch(/motion-reduce/);
  });
});
