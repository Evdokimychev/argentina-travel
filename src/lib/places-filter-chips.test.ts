import { describe, expect, it, vi } from "vitest";
import { buildPlaceFilterChips, countPlaceFilterChips } from "@/lib/places-filter-chips";
import { getDefaultPlaceCatalogFilters } from "@/lib/places-catalog-filters";

const labels = {
  searchPrefix: "Поиск",
  categoryPrefix: "Категория",
  regionPrefix: "Регион",
  provincePrefix: "Провинция",
  seasonPrefix: "Сезон",
  tagPrefix: "Тема",
};

describe("buildPlaceFilterChips", () => {
  it("builds chips for active filters", () => {
    const filters = getDefaultPlaceCatalogFilters({
      query: "ледник",
      region: "Патагония",
      tag: "природа",
    });

    const chips = buildPlaceFilterChips(filters, () => {}, labels);
    expect(chips.map((chip) => chip.id)).toEqual(["query", "region", "tag"]);
    expect(chips[0]?.label).toBe("Поиск: ледник");
    expect(chips[1]?.label).toBe("Регион: Патагония");
  });

  it("clears a field when chip remove is triggered", () => {
    const onChange = vi.fn();
    const filters = getDefaultPlaceCatalogFilters({ region: "Патагония", province: "Santa Cruz" });
    const chips = buildPlaceFilterChips(filters, onChange, labels);

    chips.find((chip) => chip.id === "province")?.onRemove();
    expect(onChange).toHaveBeenCalledWith({ ...filters, province: "" });
  });
});

describe("countPlaceFilterChips", () => {
  it("counts chips consistently with builder", () => {
    const filters = getDefaultPlaceCatalogFilters({
      query: "iguazu",
      category: "waterfall",
      season: "круглый год",
    });
    expect(countPlaceFilterChips(filters)).toBe(3);
  });
});
