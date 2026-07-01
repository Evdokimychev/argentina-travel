import type { CatalogFilterChip } from "@/components/marketplace/CatalogActiveFilterChips";
import type { PlaceCatalogFilters } from "@/types/place";
import { PLACE_CATEGORY_LABELS } from "@/types/place";

export type PlaceFilterChipLabels = {
  searchPrefix: string;
  categoryPrefix: string;
  regionPrefix: string;
  provincePrefix: string;
  seasonPrefix: string;
  tagPrefix: string;
};

export function buildPlaceFilterChips(
  filters: PlaceCatalogFilters,
  onChange: (next: PlaceCatalogFilters) => void,
  labels: PlaceFilterChipLabels,
): CatalogFilterChip[] {
  const chips: CatalogFilterChip[] = [];
  const patch = (partial: Partial<PlaceCatalogFilters>) => onChange({ ...filters, ...partial });

  if (filters.query.trim()) {
    chips.push({
      id: "query",
      label: `${labels.searchPrefix}: ${filters.query.trim()}`,
      onRemove: () => patch({ query: "" }),
    });
  }

  if (filters.category) {
    const categoryLabel = PLACE_CATEGORY_LABELS[filters.category] ?? filters.category;
    chips.push({
      id: "category",
      label: `${labels.categoryPrefix}: ${categoryLabel}`,
      onRemove: () => patch({ category: "" }),
    });
  }

  if (filters.region) {
    chips.push({
      id: "region",
      label: `${labels.regionPrefix}: ${filters.region}`,
      onRemove: () => patch({ region: "" }),
    });
  }

  if (filters.province) {
    chips.push({
      id: "province",
      label: `${labels.provincePrefix}: ${filters.province}`,
      onRemove: () => patch({ province: "" }),
    });
  }

  if (filters.season) {
    chips.push({
      id: "season",
      label: `${labels.seasonPrefix}: ${filters.season}`,
      onRemove: () => patch({ season: "" }),
    });
  }

  if (filters.tag) {
    chips.push({
      id: "tag",
      label: `${labels.tagPrefix}: ${filters.tag}`,
      onRemove: () => patch({ tag: "" }),
    });
  }

  return chips;
}

export function countPlaceFilterChips(filters: PlaceCatalogFilters): number {
  return buildPlaceFilterChips(filters, () => {}, {
    searchPrefix: "",
    categoryPrefix: "",
    regionPrefix: "",
    provincePrefix: "",
    seasonPrefix: "",
    tagPrefix: "",
  }).length;
}
