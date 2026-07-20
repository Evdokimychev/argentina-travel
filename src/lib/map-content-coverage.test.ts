import { describe, expect, it } from "vitest";

import { PLACES_SEED } from "@/data/places-seed";
import { buildKbAttractionObjects } from "@/lib/map-kb-attractions";
import { buildSupplementaryCityObjects } from "@/lib/map-supplementary-cities";

describe("map content coverage", () => {
  it("keeps the reported city gaps covered by canonical city markers", () => {
    const placesBySlug = new Map(PLACES_SEED.map((place) => [place.slug, place]));

    expect(placesBySlug.get("trevelin")?.category).toBe("city");
    expect(placesBySlug.get("lujan")?.category).toBe("city");
    expect(placesBySlug.get("pilar")?.category).toBe("city");
    expect(placesBySlug.get("zarate")?.category).toBe("city");
  });

  it("uses the complete public knowledge base instead of one source domain", () => {
    const objects = buildKbAttractionObjects([]);
    const tigre = objects.find((object) => object.id === "kb:tigre-i-delta");

    expect(tigre).toMatchObject({
      title: "Тигре и Дельта Параны",
      kind: "attraction",
      href: "/baza-znaniy/tigre-i-delta",
    });
  }, 30_000);

  it("links supplementary city markers to their differently named articles", () => {
    const objects = buildSupplementaryCityObjects([]);

    expect(objects.find((object) => object.slug === "tigre")).toMatchObject({
      title: "Тигре",
      kind: "city",
      href: "/baza-znaniy/tigre-i-delta",
      minZoom: 6,
    });
  });

  it("includes Chacarita as a local historic place revealed on closer zoom", () => {
    const place = PLACES_SEED.find((entry) => entry.slug === "cementerio-de-la-chacarita");

    expect(place).toMatchObject({
      name: "Кладбище Чакарита",
      category: "historic",
      city: "Buenos Aires",
    });
  });
});
