import { describe, expect, it } from "vitest";
import { DESTINATION_PAGES } from "@/data/destination-pages";
import {
  formatDestinationTaxonomySummary,
  resolveDestinationTaxonomy,
} from "@/lib/destination-taxonomy";
import { buildDestinationsCatalogJsonLd } from "@/lib/destinations-catalog-seo";

describe("public destination taxonomy", () => {
  it("classifies the current catalog as seven cities and one macroregion", () => {
    const kinds = DESTINATION_PAGES.map(
      (destination) => resolveDestinationTaxonomy(destination).kind,
    );
    expect(kinds.filter((kind) => kind === "city")).toHaveLength(7);
    expect(kinds.filter((kind) => kind === "macroregion")).toHaveLength(1);
    expect(kinds.filter((kind) => kind === "province")).toHaveLength(0);
    expect(formatDestinationTaxonomySummary(DESTINATION_PAGES)).toBe(
      "7 городов · 1 макрорегион",
    );
  });

  it("shows a province or autonomous-city context for every city", () => {
    const cities = DESTINATION_PAGES.filter(
      (destination) => resolveDestinationTaxonomy(destination).kind === "city",
    );
    for (const city of cities) {
      const area = resolveDestinationTaxonomy(city).administrativeArea;
      expect(area).toMatch(/^(Провинция|Автономный город) /);
    }
  });

  it("does not present Patagonia as a province", () => {
    const patagonia = DESTINATION_PAGES.find((destination) => destination.id === "patagonia");
    expect(patagonia).toBeDefined();
    expect(resolveDestinationTaxonomy(patagonia!).kindLabel).toBe("Макрорегион");
    expect(resolveDestinationTaxonomy(patagonia!).administrativeArea).toBe("Юг Аргентины");
  });

  it("uses a neutral label for future CMS-only destinations", () => {
    expect(resolveDestinationTaxonomy({ id: "future", region: "Аргентина" })).toEqual({
      kind: "destination",
      kindLabel: "Направление",
      administrativeArea: "Аргентина",
    });
  });

  it("uses a destination catalog title without calling every item a region", () => {
    const jsonLd = buildDestinationsCatalogJsonLd(DESTINATION_PAGES, "ru");
    expect(jsonLd.name).toBe("Направления и места");
    expect(jsonLd.numberOfItems).toBe(8);
    expect(jsonLd.description).toContain("7 городов и 1 макрорегион");
  });
});
