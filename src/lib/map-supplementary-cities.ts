import { ARGENTINA_CITIES } from "@/data/argentina-cities";
import type { MapObject } from "@/lib/map-types";
import type { PlaceListing } from "@/types/place";

/** Города из справочника, которых нет в каталоге мест — добавляем на карту как city. */
export function buildSupplementaryCityObjects(places: PlaceListing[]): MapObject[] {
  const coveredSlugs = new Set(places.map((place) => place.slug));
  const coveredCoords = new Set(
    places.map((place) => `${place.latitude.toFixed(3)}:${place.longitude.toFixed(3)}`)
  );

  const objects: MapObject[] = [];

  for (const city of ARGENTINA_CITIES) {
    if (city.lat == null || city.lng == null) continue;
    if (coveredSlugs.has(city.slug)) continue;

    const coordKey = `${city.lat.toFixed(3)}:${city.lng.toFixed(3)}`;
    if (coveredCoords.has(coordKey)) continue;

    objects.push({
      id: `city:${city.slug}`,
      slug: city.slug,
      kind: "city",
      title: city.nameRu,
      description: `${city.provinceRu} · ${city.macroRegionRu}`,
      latitude: city.lat,
      longitude: city.lng,
      region: city.macroRegionRu,
      href: `/baza-znaniy/${city.slug}`,
      meta: city.provinceRu,
      relatedArticles: [{ title: city.nameRu, href: `/baza-znaniy/${city.slug}` }],
    });
  }

  return objects;
}
