import { describe, expect, it } from "vitest";
import {
  matchesTourEmbedQuery,
  resolveTourEmbedMatches,
  resolveTourEmbedWidgetMatches,
} from "@/lib/tour-embed";
import type { TourListing } from "@/types";

function tour(slug: string, overrides: Partial<TourListing>): TourListing {
  return {
    id: slug,
    slug,
    title: slug,
    shortDescription: "",
    image: "/tour.jpg",
    gallery: [],
    destination: "Аргентина",
    region: "Аргентина",
    country: "Аргентина",
    activityType: "Экскурсионные туры",
    durationDays: 7,
    durationNights: 6,
    durationBucket: "7–9 дней",
    priceUsd: 1000,
    accommodationType: "Отели 3*",
    comfortLevel: "Стандарт",
    difficultyLevel: "Легкий",
    language: ["Русский"],
    childrenAllowed: "Можно с детьми",
    minimumAge: 6,
    groupSizeMin: 2,
    groupSizeMax: 12,
    groupSizeBucket: "До 12 человек",
    availableDates: [],
    latitude: -34.6,
    longitude: -58.4,
    rating: 4.8,
    reviewCount: 10,
    organizer: { name: "Организатор", avatar: "" },
    badges: [],
    ...overrides,
  } as TourListing;
}

const catalog = [
  tour("valdes", {
    title: "Киты полуострова Вальдес",
    destination: "Пуэрто-Мадрин",
    region: "Патагония",
  }),
  tour("mendoza-wine", {
    title: "Винодельни Мендосы и долины Уко",
    destination: "Мендоса",
    region: "Мендоса",
  }),
  tour("mendoza-city", {
    title: "Архитектура Мендосы",
    destination: "Мендоса",
    region: "Мендоса",
  }),
  tour("iguazu", {
    title: "Водопады Игуасу",
    destination: "Пуэрто-Игуасу",
    region: "Мисьонес",
  }),
  tour("bariloche", {
    title: "Барилоче и Науэль-Уапи",
    destination: "Барилоче",
    region: "Патагония",
  }),
  tour("ba", {
    title: "Буэнос-Айрес за три дня",
    destination: "Буэнос-Айрес",
    region: "Буэнос-Айрес",
  }),
  tour("mendoza-penguins", {
    title: "Пингвины: фотовыставка в Мендосе",
    destination: "Мендоса",
    region: "Мендоса",
  }),
];

describe("tour embed contextual matching", () => {
  it("понимает составной запрос о китах вместо буквального совпадения всей строки", () => {
    expect(matchesTourEmbedQuery(catalog[0], "Valdes whale Puerto Madryn")).toBe(true);
    expect(matchesTourEmbedQuery(catalog[5], "Valdes whale Puerto Madryn")).toBe(false);
  });

  it("требует одновременно географию и тему для винного запроса", () => {
    const matches = resolveTourEmbedMatches(catalog, {
      kind: "query",
      query: "Mendoza Uco wine",
    });
    expect(matches.map((match) => match.tour.slug)).toEqual(["mendoza-wine"]);
    expect(matches[0]?.reasons.join(" ")).toContain("Мендосы");
    expect(matches[0]?.reasons.join(" ")).toContain("винодельни");
  });

  it("считает несколько направлений в обзорном запросе альтернативами", () => {
    const matches = resolveTourEmbedMatches(catalog, {
      kind: "query",
      query: "Argentina Patagonia Iguazu Bariloche",
    });
    expect(matches.map((match) => match.tour.slug)).toEqual(["iguazu", "bariloche"]);
  });

  it("не выдумывает стоимость или наличие в объяснении", () => {
    const matches = resolveTourEmbedWidgetMatches(catalog, {
      variant: "compact-list",
      title: "Киты",
      source: { kind: "query", query: "whale Valdes" },
    });
    const explanation = matches.flatMap((match) => match.reasons).join(" ").toLowerCase();
    expect(explanation).not.toMatch(/цена|стоимост|места|доступ/);
    expect(matches.map((match) => match.tour.slug)).toEqual(["valdes"]);
  });

  it("не показывает короткий тур под заголовком про маршрут на 10 дней", () => {
    const tenDays = tour("patagonia-10", {
      title: "Патагония и ледники",
      destination: "Эль-Калафате",
      region: "Патагония",
      durationDays: 10,
      durationNights: 9,
    });
    const fourDays = tour("iguazu-4", {
      title: "Водопады Игуасу",
      destination: "Пуэрто-Игуасу",
      region: "Мисьонес",
      durationDays: 4,
      durationNights: 3,
    });
    const matches = resolveTourEmbedWidgetMatches([tenDays, fourDays], {
      variant: "featured",
      title: "Туры по Аргентине на 10 дней",
      source: { kind: "query", query: "Argentina Patagonia Iguazu" },
    });
    expect(matches.map((match) => match.tour.slug)).toEqual(["patagonia-10"]);
    expect(matches[0]?.reasons.join(" ")).toContain("10 дней");
  });
});
