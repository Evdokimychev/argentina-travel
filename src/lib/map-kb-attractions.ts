/**
 * Достопримечательности из базы знаний (Argentina.travel) на интерактивной карте —
 * без дублирования записей каталога мест.
 */
import { KB_ID_TO_PLACE } from "@/data/kb-place-id-map";
import { getAllEntries } from "@/lib/knowledge-base/content";
import { entryHref } from "@/lib/knowledge-base/urls";
import { mediaUrl } from "@/lib/media-resolver";
import type { MapObject } from "@/lib/map-types";
import type { PlaceListing } from "@/types/place";

const KB_REGION_LABEL: Record<string, string> = {
  noa: "Северо-Запад",
  patagonia: "Патагония",
  cuyo: "Куйо",
  litoral: "Северо-Восток",
  pampa: "Центр и Пампа",
  "buenos-aires-province": "Центр и Пампа",
  caba: "Центр и Пампа",
  "tierra-del-fuego": "Огненная Земля",
};

function isArgentinaTravelEntry(entry: {
  sources?: Array<{ url?: string; note?: string }>;
  media?: { hero?: { license?: string; source_page?: string } } | null;
}): boolean {
  if (entry.media?.hero?.license === "argentina.travel") return true;
  if (entry.media?.hero?.source_page?.includes("argentina.travel")) return true;
  return (
    entry.sources?.some(
      (s) =>
        s.url?.includes("argentina.travel") ||
        s.note?.toLowerCase().includes("inprotur") ||
        s.note?.toLowerCase().includes("argentina.travel"),
    ) ?? false
  );
}

function kbKind(type: string): MapObject["kind"] {
  if (type === "city") return "city";
  if (type === "national_park") return "national_park";
  return "attraction";
}

/** KB-объекты с координатами, которых ещё нет на карте через каталог мест. */
export function buildKbAttractionObjects(places: PlaceListing[]): MapObject[] {
  const coveredSlugs = new Set(places.map((p) => p.slug));
  const coveredCoords = new Set(
    places.map((p) => `${p.latitude.toFixed(3)}:${p.longitude.toFixed(3)}`),
  );

  const objects: MapObject[] = [];

  for (const entry of getAllEntries()) {
    if (!isArgentinaTravelEntry(entry)) continue;
    if (!entry.coordinates?.lat || !entry.coordinates.lng) continue;
    if (!["city", "national_park", "attraction"].includes(entry.type)) continue;

    const mappedPlace = KB_ID_TO_PLACE[entry.id];
    if (mappedPlace && coveredSlugs.has(mappedPlace)) continue;

    const coordKey = `${entry.coordinates.lat.toFixed(3)}:${entry.coordinates.lng.toFixed(3)}`;
    if (coveredCoords.has(coordKey)) continue;

    const heroUrl = entry.media?.hero?.url;
    const image = heroUrl ? mediaUrl(heroUrl.replace(/^\//, "")) : undefined;
    const href = mappedPlace ? `/places/${mappedPlace}` : entryHref(entry.id);

    objects.push({
      id: `kb:${entry.id}`,
      slug: mappedPlace ?? entry.id,
      kind: kbKind(entry.type),
      title: entry.title,
      description: entry.summary ?? "",
      image,
      latitude: entry.coordinates.lat,
      longitude: entry.coordinates.lng,
      region: entry.region_id ? KB_REGION_LABEL[entry.region_id] ?? entry.region_id : "Аргентина",
      href,
      meta: entry.province ?? entry.region_id ?? "",
      relatedArticles: [{ title: entry.title, href: entryHref(entry.id) }],
    });

    coveredCoords.add(coordKey);
    coveredSlugs.add(mappedPlace ?? entry.id);
  }

  return objects;
}
