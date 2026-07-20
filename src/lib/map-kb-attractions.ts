/**
 * Публичные гео-объекты из редакционной базы знаний на интерактивной карте —
 * без дублирования записей каталога мест. getAllEntries() уже применяет единый
 * publication-quality gate, поэтому источник материала не должен дополнительно
 * ограничивать полноту карты.
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

function kbKind(type: string): MapObject["kind"] {
  if (type === "city") return "city";
  if (type === "national_park") return "national_park";
  return "attraction";
}

function kbCategory(entry: {
  type: string;
  subtype?: string | null;
  title: string;
  tags?: string[];
}): string {
  if (entry.type === "city") return "city";
  if (entry.type === "national_park") return "national_park";

  const haystack = [entry.subtype, entry.title, ...(entry.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru");
  if (/вин|bodega|винодель/.test(haystack)) return "winery";
  if (/музе|museum/.test(haystack)) return "museum";
  if (/собор|базилик|церк|кладбищ|истор|археолог|памятник/.test(haystack)) return "historic";
  if (/ледник/.test(haystack)) return "glacier";
  if (/водопад|каскад/.test(haystack)) return "waterfall";
  if (/озер|лагун/.test(haystack)) return "lake";
  if (/пляж|берег|дюн/.test(haystack)) return "beach";
  if (/гора|вулкан|трек|sender|поход/.test(haystack)) return "trekking";
  if (/заповед|резерват|природ|парк/.test(haystack)) return "reserve";
  return "attraction";
}

export function resolveKbMapImage(heroUrl?: string): string | undefined {
  if (!heroUrl) return undefined;
  if (heroUrl.startsWith("/media/")) return heroUrl;
  return mediaUrl(heroUrl.replace(/^\//, ""));
}

/** KB-объекты с координатами, которых ещё нет на карте через каталог мест. */
export function buildKbAttractionObjects(places: PlaceListing[]): MapObject[] {
  const coveredSlugs = new Set(places.map((p) => p.slug));
  const coveredCoords = new Set(
    places.map((p) => `${p.latitude.toFixed(3)}:${p.longitude.toFixed(3)}`),
  );

  const objects: MapObject[] = [];

  for (const entry of getAllEntries()) {
    if (!entry.coordinates?.lat || !entry.coordinates.lng) continue;
    if (!["city", "national_park", "attraction"].includes(entry.type)) continue;

    const mappedPlace = KB_ID_TO_PLACE[entry.id];
    if (mappedPlace && coveredSlugs.has(mappedPlace)) continue;

    const coordKey = `${entry.coordinates.lat.toFixed(3)}:${entry.coordinates.lng.toFixed(3)}`;
    if (coveredCoords.has(coordKey)) continue;

    const heroUrl = entry.media?.hero?.url;
    // KB already points to a bundled public asset. Keeping that URL local gives
    // the map a reliable fallback even when the media CDN has not received a
    // newly imported Argentina.travel file yet.
    const image = resolveKbMapImage(heroUrl);
    const href = mappedPlace ? `/places/${mappedPlace}` : entryHref(entry.id);
    const kind = kbKind(entry.type);
    const sourceUrl = entry.sources?.find((source) => source.url)?.url;
    const wordCount = entry.editorial?.word_count ?? 0;

    objects.push({
      id: `kb:${entry.id}`,
      slug: mappedPlace ?? entry.id,
      kind,
      title: entry.title,
      description: entry.summary ?? "",
      image,
      latitude: entry.coordinates.lat,
      longitude: entry.coordinates.lng,
      region: entry.region_id ? KB_REGION_LABEL[entry.region_id] ?? entry.region_id : "Аргентина",
      href,
      meta: entry.province ?? entry.region_id ?? "",
      category: kbCategory(entry),
      featured: false,
      importance: kind === "national_park" ? 78 : kind === "city" ? 74 : 58,
      editorialPriority: kind === "national_park" ? 78 : kind === "city" ? 74 : 58,
      qualityScore: wordCount >= 300 && sourceUrl ? 90 : sourceUrl ? 84 : 76,
      source: "Редакционная база знаний GoArgentina",
      sourceUrl,
      sourceVerifiedAt: entry.last_verified ?? undefined,
      minZoom: kind === "national_park" ? 5 : kind === "city" ? 6 : 8,
      maxZoom: 18,
      tags: [entry.type, entry.subtype ?? "", ...(entry.tags ?? []), ...(entry.aliases ?? [])].filter(Boolean),
      status: "published",
      relatedArticles: [{ title: entry.title, href: entryHref(entry.id) }],
    });

    coveredCoords.add(coordKey);
    coveredSlugs.add(mappedPlace ?? entry.id);
  }

  return objects;
}
