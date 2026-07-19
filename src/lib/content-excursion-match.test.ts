import { describe, expect, it } from "vitest";
import {
  resolveExcursionsForBlogPost,
  resolveExcursionsForKnowledgeEntry,
} from "@/lib/content-excursion-match";
import type { ExcursionListing } from "@/types/excursion";

function excursion(
  slug: string,
  overrides: Partial<ExcursionListing> = {},
): ExcursionListing {
  return {
    partner: "tripster",
    id: Math.abs(slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)),
    slug,
    title: slug,
    cityId: 1,
    citySlug: "buenos-aires",
    cityName: "Буэнос-Айрес",
    reviewCount: 0,
    ...overrides,
  };
}

const catalog: ExcursionListing[] = [
  excursion("mendoza-wine", {
    title: "Винодельни Мендосы и дегустация мальбека",
    citySlug: "mendoza",
    cityName: "Мендоса",
    rating: 4.9,
    reviewCount: 80,
  }),
  excursion("mendoza-penguins", {
    title: "Фотовыставка о пингвинах",
    citySlug: "mendoza",
    cityName: "Мендоса",
  }),
  excursion("ba-food", {
    title: "Гастрономическая прогулка: асадо и рынки",
    citySlug: "buenos-aires",
    cityName: "Буэнос-Айрес",
    partner: "sputnik8",
  }),
  excursion("valdes-whales", {
    title: "Киты полуострова Вальдес",
    citySlug: "puerto-madryn",
    cityName: "Пуэрто-Мадрин",
  }),
  excursion("platform-wine", {
    partner: "platform",
    title: "Вино Мендосы",
    citySlug: "mendoza",
    cityName: "Мендоса",
  }),
];

describe("content excursion relevance", () => {
  it("требует одновременно географию и тему", () => {
    const matches = resolveExcursionsForBlogPost(
      {
        title: "Винный гид",
        category: "Винодельни",
        tags: ["Мендоса"],
        tourEmbeds: [
          {
            variant: "featured",
            title: "Винные экскурсии",
            source: { kind: "query", query: "Mendoza Uco wine" },
          },
        ],
      },
      catalog,
    );
    expect(matches.map((match) => match.excursion.slug)).toEqual(["mendoza-wine"]);
    expect(matches[0]?.reasons.join(" ")).toContain("Мендосы");
    expect(matches[0]?.reasons.join(" ")).toContain("винодельням");
  });

  it("не принимает «пингвины» за сигнал о вине", () => {
    const matches = resolveExcursionsForBlogPost(
      {
        title: "Вино Мендосы",
        category: "Винодельни",
        tags: ["Мендоса"],
      },
      catalog,
    );
    expect(matches.map((match) => match.excursion.slug)).toEqual(["mendoza-wine"]);
  });

  it("оставляет только реальные партнёрские ExcursionListing", () => {
    const matches = resolveExcursionsForBlogPost(
      {
        title: "Вино Мендосы",
        category: "Винодельни",
        tags: ["Мендоса"],
      },
      catalog,
    );
    expect(matches.every((match) => ["tripster", "sputnik8"].includes(match.excursion.partner))).toBe(true);
    expect(matches.map((match) => match.excursion.slug)).not.toContain("platform-wine");
  });

  it("связывает статью о Вальдесе с наблюдением за китами", () => {
    const matches = resolveExcursionsForBlogPost(
      {
        title: "Киты Патагонии",
        category: "Животные Аргентины",
        tags: ["Вальдес"],
        tourEmbeds: [
          {
            variant: "featured",
            title: "Киты",
            source: { kind: "query", query: "Valdes whale Puerto Madryn" },
          },
        ],
      },
      catalog,
    );
    expect(matches.map((match) => match.excursion.slug)).toEqual(["valdes-whales"]);
  });

  it("добавляет гастрономическую экскурсию к справке о кухне", () => {
    const matches = resolveExcursionsForKnowledgeEntry(
      {
        type: "guide",
        title: "Кухня Аргентины",
        summary: "Асадо, рынки и гастрономические традиции",
        tags: ["еда"],
      },
      catalog,
    );
    expect(matches.map((match) => match.excursion.slug)).toContain("ba-food");
  });

  it("не добавляет коммерческий блок в юридическую FAQ без туристического контекста", () => {
    const matches = resolveExcursionsForKnowledgeEntry(
      {
        type: "faq",
        title: "Как оформить DNI",
        summary: "Документы и сроки оформления",
      },
      catalog,
    );
    expect(matches).toEqual([]);
  });

  it("не использует в причинах цену или неподтверждённую доступность", () => {
    const matches = resolveExcursionsForBlogPost(
      { title: "Кухня Аргентины", category: "Кухня Аргентины", tags: ["асадо"] },
      catalog,
    );
    expect(matches.flatMap((match) => match.reasons).join(" ").toLowerCase()).not.toMatch(
      /цена|стоимост|доступ|свободн|места/,
    );
  });
});
