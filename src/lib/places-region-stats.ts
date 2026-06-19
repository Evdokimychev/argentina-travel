import type { PlaceListing } from "@/types/place";

export type PlaceRegionSummary = {
  region: string;
  count: number;
  coverImage?: string;
  highlightName?: string;
};

/** Top place per region by popularity — used for region explorer cards. */
export function getRegionSummaries(places: PlaceListing[]): PlaceRegionSummary[] {
  const byRegion = new Map<string, PlaceListing[]>();

  for (const place of places) {
    const list = byRegion.get(place.region) ?? [];
    list.push(place);
    byRegion.set(place.region, list);
  }

  return [...byRegion.entries()]
    .map(([region, regionPlaces]) => {
      const top = [...regionPlaces].sort((a, b) => b.popularity - a.popularity)[0];
      return {
        region,
        count: regionPlaces.length,
        coverImage: top?.coverImage,
        highlightName: top?.name,
      };
    })
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region, "ru"));
}
