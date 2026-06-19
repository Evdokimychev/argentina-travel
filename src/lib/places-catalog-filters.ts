import type { PlaceCatalogFilters, PlaceListing, PlaceSortOption } from "@/types/place";

export type { PlaceCatalogFilters, PlaceSortOption };

export function getDefaultPlaceCatalogFilters(
  overrides: Partial<PlaceCatalogFilters> = {},
): PlaceCatalogFilters {
  return {
    query: "",
    category: "",
    region: "",
    province: "",
    season: "",
    tag: "",
    sort: "popular",
    ...overrides,
  };
}

export function filterPlaces(items: PlaceListing[], filters: PlaceCatalogFilters): PlaceListing[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.region && item.region !== filters.region) return false;
    if (filters.province && item.province !== filters.province) return false;

    if (filters.season) {
      const seasonHaystack = (item.season ?? "").toLowerCase();
      if (!seasonHaystack.includes(filters.season.toLowerCase())) return false;
    }

    if (filters.tag) {
      const tag = filters.tag.toLowerCase();
      const hasTag = item.tags.some((value) => value.toLowerCase() === tag);
      if (!hasTag) return false;
    }

    if (normalizedQuery) {
      const haystack = [
        item.name,
        item.shortDescription,
        item.region,
        item.province,
        item.city,
        ...item.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    return true;
  });
}

export function sortPlaces(items: PlaceListing[], sort: PlaceSortOption): PlaceListing[] {
  const copy = [...items];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => {
        const ar = a.rating ?? -1;
        const br = b.rating ?? -1;
        if (br !== ar) return br - ar;
        return b.popularity - a.popularity;
      });
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    case "name_desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name, "ru"));
    default:
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}

export function countActivePlaceFilters(filters: PlaceCatalogFilters): number {
  let count = 0;
  if (filters.category) count += 1;
  if (filters.region) count += 1;
  if (filters.province) count += 1;
  if (filters.season) count += 1;
  if (filters.tag) count += 1;
  return count;
}

export function parsePlaceFiltersFromSearchParams(
  params: URLSearchParams,
): PlaceCatalogFilters {
  const sort = params.get("sort") as PlaceSortOption | null;
  const category = params.get("category") as PlaceCatalogFilters["category"] | null;

  return getDefaultPlaceCatalogFilters({
    query: params.get("query") ?? "",
    category: category ?? "",
    region: params.get("region") ?? "",
    province: params.get("province") ?? "",
    season: params.get("season") ?? "",
    tag: params.get("tag") ?? "",
    sort: sort || "popular",
  });
}

export function parsePlaceFiltersFromSearchParamsRecord(
  searchParams: Record<string, string | string[] | undefined>,
): PlaceCatalogFilters {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return parsePlaceFiltersFromSearchParams(params);
}

export function parsePlacesViewMode(
  searchParams: Record<string, string | string[] | undefined>,
): "grid" | "map" {
  const view = searchParams.view;
  const raw = typeof view === "string" ? view : Array.isArray(view) ? view[0] : "";
  return raw === "map" ? "map" : "grid";
}

export function placeFiltersToSearchParams(filters: PlaceCatalogFilters, page = 1): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.region) params.set("region", filters.region);
  if (filters.province) params.set("province", filters.province);
  if (filters.season) params.set("season", filters.season);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.sort !== "popular") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const view = params.get("view");
  if (view === "map") params.set("view", "map");
  return params;
}

export function getUniqueRegions(places: PlaceListing[]): string[] {
  return [...new Set(places.map((p) => p.region))].sort((a, b) => a.localeCompare(b, "ru"));
}

export function getUniqueProvinces(places: PlaceListing[]): string[] {
  return [...new Set(places.map((p) => p.province).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
}

export function buildPlacesCatalogHref(
  filters: Partial<PlaceCatalogFilters> = {},
  options: { view?: "map" } = {},
): string {
  const params = placeFiltersToSearchParams({
    ...getDefaultPlaceCatalogFilters(),
    ...filters,
  });
  if (options.view === "map") params.set("view", "map");
  const qs = params.toString();
  return qs ? `/places?${qs}` : "/places";
}
