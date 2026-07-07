import {
  QUICK_EXPLORE_PROVINCES,
  QUICK_EXPLORE_PROVINCE_BY_ISO,
} from "@/data/quick-explore/province-registry";
import { KB_ID_TO_PLACE, PLACE_TO_KB_ID } from "@/data/kb-place-id-map";
import { getAllEntries, getEntry } from "@/lib/knowledge-base/content";
import { entryHref } from "@/lib/knowledge-base/urls";
import type { KbMediaImage } from "@/lib/knowledge-base/types";
import { fetchMapObjects } from "@/lib/map-objects-server";
import type { MapMarkerKind, MapObject } from "@/lib/map-types";
import { fetchPlacesServer } from "@/lib/places-repository";
import { placeHref } from "@/lib/places-urls";
import {
  kbIdForPlaceSlug,
  resolveProvinceIso,
  sortExploreSpotsByTitle,
} from "@/lib/quick-explore/resolve-province";
import type {
  QuickExploreImage,
  QuickExplorePayload,
  QuickExploreSpot,
  QuickExploreSpotKind,
} from "@/lib/quick-explore/types";

const EXPLORE_KINDS: MapMarkerKind[] = ["city", "national_park", "attraction"];

function mediaCredit(media: KbMediaImage): string | undefined {
  const parts: string[] = [];
  if (media.author) parts.push(media.author);
  if (media.license) {
    const licenseLabel =
      media.license === "own"
        ? "авторское фото проекта"
        : media.license === "argentina.travel"
          ? "Argentina.travel"
          : media.license;
    parts.push(licenseLabel);
  }
  if (media.source_page?.includes("argentina.travel")) {
    parts.push("Argentina.travel");
  }
  return parts.length ? `Фото: ${parts.join(" · ")}` : undefined;
}

function imageFromKb(kbId: string): QuickExploreImage | undefined {
  const entry = getEntry(kbId);
  const hero = entry?.media?.hero;
  if (!hero?.url) return undefined;
  return {
    url: hero.url,
    alt: hero.alt ?? entry?.title,
    credit: mediaCredit(hero),
    sourceUrl: hero.source_page,
  };
}

function imageForSpot(slug: string, fallbackUrl?: string): QuickExploreImage | undefined {
  const kbId = kbIdForPlaceSlug(slug) ?? slug;
  const fromKb = imageFromKb(kbId);
  if (fromKb) return fromKb;
  if (fallbackUrl) return { url: fallbackUrl, alt: slug };
  return undefined;
}

function mapObjectToSpot(
  obj: MapObject,
  placeBySlug: Map<string, Awaited<ReturnType<typeof fetchPlacesServer>>[number]>
): QuickExploreSpot | null {
  if (!EXPLORE_KINDS.includes(obj.kind)) return null;

  const place = placeBySlug.get(obj.slug);
  const kbId = kbIdForPlaceSlug(obj.slug) ?? (getEntry(obj.slug) ? obj.slug : undefined);
  const kbEntry = kbId ? getEntry(kbId) : null;

  const iso = resolveProvinceIso(
    place?.province ?? kbEntry?.province ?? obj.meta ?? obj.region,
    obj.slug
  );
  if (!iso) return null;
  const hrefPlace = obj.href.startsWith("/places/") ? obj.href : undefined;
  const hrefKb = kbId ? entryHref(kbId) : obj.href.startsWith("/baza-znaniy/") ? obj.href : undefined;

  return {
    id: obj.id,
    slug: obj.slug,
    provinceIso: iso,
    kind: obj.kind as QuickExploreSpotKind,
    title: obj.title,
    summary: obj.description ?? "",
    latitude: obj.latitude,
    longitude: obj.longitude,
    region: obj.region,
    image: imageForSpot(obj.slug, obj.image),
    hrefPlace: hrefPlace ?? (KB_ID_TO_PLACE[kbId ?? ""] ? placeHref(obj.slug) : undefined),
    hrefKb,
    kbId,
  };
}

function isArgentinaTravelKb(entry: NonNullable<ReturnType<typeof getEntry>>): boolean {
  if (entry.media?.hero?.license === "argentina.travel") return true;
  return (
    entry.sources?.some(
      (s) => s.url?.includes("argentina.travel") || s.note?.toLowerCase().includes("inprotur"),
    ) ?? false
  );
}

function kbSpotsWithoutPlace(seenSlugs: Set<string>): QuickExploreSpot[] {
  const out: QuickExploreSpot[] = [];

  for (const entry of getAllEntries()) {
    if (!isArgentinaTravelKb(entry)) continue;
    if (!entry.coordinates?.lat || !entry.coordinates.lng) continue;
    if (!["city", "national_park", "attraction"].includes(entry.type)) continue;

    const mappedPlace = KB_ID_TO_PLACE[entry.id];
    if (mappedPlace && seenSlugs.has(mappedPlace)) continue;
    if (seenSlugs.has(entry.id)) continue;

    const iso =
      resolveProvinceIso(entry.province ?? null, entry.id) ??
      resolveProvinceIso(entry.region_id ?? null, entry.id);
    if (!iso) continue;

    const kind =
      entry.type === "city"
        ? "city"
        : entry.type === "national_park"
          ? "national_park"
          : "attraction";

    out.push({
      id: `kb:${entry.id}`,
      slug: mappedPlace ?? entry.id,
      provinceIso: iso,
      kind,
      title: entry.title,
      summary: entry.summary ?? "",
      latitude: entry.coordinates.lat,
      longitude: entry.coordinates.lng,
      region: QUICK_EXPLORE_PROVINCE_BY_ISO[iso]?.macroRegionRu ?? "",
      image: imageFromKb(entry.id),
      hrefPlace: mappedPlace && !seenSlugs.has(mappedPlace) ? placeHref(mappedPlace) : undefined,
      hrefKb: entryHref(entry.id),
      kbId: entry.id,
    });
    seenSlugs.add(mappedPlace ?? entry.id);
    seenSlugs.add(entry.id);
  }

  return out;
}

export async function buildQuickExplorePayload(): Promise<QuickExplorePayload> {
  const [{ objects }, places] = await Promise.all([
    fetchMapObjects({ kinds: EXPLORE_KINDS }),
    fetchPlacesServer(),
  ]);
  const placeBySlug = new Map(places.map((place) => [place.slug, place]));
  const spots: QuickExploreSpot[] = [];
  const seenSlugs = new Set<string>();

  for (const obj of objects) {
    const spot = mapObjectToSpot(obj, placeBySlug);
    if (!spot) continue;
    if (seenSlugs.has(spot.slug)) continue;
    spots.push(spot);
    seenSlugs.add(spot.slug);
  }

  spots.push(...kbSpotsWithoutPlace(seenSlugs));
  spots.sort(sortExploreSpotsByTitle);

  const countByIso = new Map<string, number>();
  for (const spot of spots) {
    countByIso.set(spot.provinceIso, (countByIso.get(spot.provinceIso) ?? 0) + 1);
  }

  const provinces = QUICK_EXPLORE_PROVINCES.map((p) => ({
    iso: p.iso,
    slug: p.slug,
    nameRu: p.nameRu,
    macroRegionRu: p.macroRegionRu,
    center: p.center,
    zoom: p.zoom,
    spotCount: countByIso.get(p.iso) ?? 0,
  })).sort((a, b) => a.nameRu.localeCompare(b.nameRu, "ru"));

  return { provinces, spots };
}
