import { describe, expect, it } from "vitest";
import { findBestMapObjectMatch, searchMapObjects } from "@/lib/map-search";
import type { MapObject } from "@/lib/map-types";

const sampleObjects: MapObject[] = [
  {
    id: "place:bariloche",
    slug: "bariloche",
    kind: "city",
    title: "Барилоче",
    region: "Патагония",
    latitude: -41.13,
    longitude: -71.31,
    href: "/places/bariloche",
    meta: "Río Negro",
  },
  {
    id: "place:perito",
    slug: "perito-moreno-glacier",
    kind: "attraction",
    title: "Ледник Перито-Морено",
    region: "Патагония",
    latitude: -50.5,
    longitude: -73.05,
    href: "/places/perito-moreno-glacier",
    meta: "Эль-Калафате",
    description: "Ледник в нацпарке Лос-Гласьярес",
  },
  {
    id: "tour:1",
    slug: "patagonia-tour",
    kind: "tour",
    title: "Патагония за 10 дней",
    region: "Патагония",
    latitude: -50.3,
    longitude: -72.3,
    href: "/tours/patagonia-tour",
    meta: "Барилоче — Калафате",
  },
];

describe("map-search", () => {
  it("finds by city meta and region", () => {
    expect(findBestMapObjectMatch(sampleObjects, "калафате")?.id).toBe("place:perito");
    expect(findBestMapObjectMatch(sampleObjects, "патагония")?.kind).toBe("tour");
  });

  it("ranks exact title matches higher", () => {
    const results = searchMapObjects(sampleObjects, "барилоче");
    expect(results[0]?.title).toBe("Барилоче");
  });

  it("matches category labels", () => {
    expect(findBestMapObjectMatch(sampleObjects, "экскурсии")?.kind).toBe("tour");
  });

  it("matches editorial tags that are not repeated in the title", () => {
    const tagged = sampleObjects.map((item) =>
      item.id === "place:bariloche" ? { ...item, tags: ["шоколад", "озёра"] } : item,
    );
    expect(findBestMapObjectMatch(tagged, "шоколад")?.id).toBe("place:bariloche");
  });
});
