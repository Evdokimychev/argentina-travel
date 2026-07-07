import { MAP_MARKER_KIND_LABELS, type MapMarkerKind, type MapObject } from "@/lib/map-types";

export interface MapSearchSuggestion {
  id: string;
  label: string;
  subtitle?: string;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function objectSearchHaystack(obj: MapObject): string {
  const kindLabel = MAP_MARKER_KIND_LABELS[obj.kind] ?? obj.kind;
  return [
    obj.title,
    obj.slug,
    obj.meta ?? "",
    obj.region,
    obj.description ?? "",
    kindLabel,
  ]
    .join(" ")
    .toLowerCase();
}

function matchScore(obj: MapObject, needle: string): number {
  const q = normalizeSearchText(needle);
  if (!q) return 0;

  const title = obj.title.toLowerCase();
  const slug = obj.slug.toLowerCase();
  const meta = (obj.meta ?? "").toLowerCase();
  const region = obj.region.toLowerCase();
  const kind = (MAP_MARKER_KIND_LABELS[obj.kind] ?? obj.kind).toLowerCase();

  if (title === q || slug === q) return 100;
  if (title.startsWith(q)) return 90;
  if (slug.startsWith(q)) return 85;
  if (meta.startsWith(q) || region.startsWith(q)) return 75;
  if (title.includes(q)) return 60;
  if (meta.includes(q) || region.includes(q) || kind.includes(q)) return 50;
  if (objectSearchHaystack(obj).includes(q)) return 30;
  return 0;
}

export function searchMapObjects(
  objects: MapObject[],
  query: string,
  limit = 8
): MapObject[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [];

  return objects
    .map((obj) => ({ obj, score: matchScore(obj, needle) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.obj.title.localeCompare(b.obj.title, "ru"))
    .slice(0, limit)
    .map((item) => item.obj);
}

export function findBestMapObjectMatch(
  objects: MapObject[],
  query: string
): MapObject | undefined {
  return searchMapObjects(objects, query, 1)[0];
}

export function mapObjectsToSuggestions(objects: MapObject[]): MapSearchSuggestion[] {
  return objects.map((obj) => ({
    id: obj.id,
    label: obj.title,
    subtitle: [MAP_MARKER_KIND_LABELS[obj.kind], obj.meta ?? obj.region].filter(Boolean).join(" · "),
  }));
}

export function kindLabelForSearch(kind: MapMarkerKind): string {
  return MAP_MARKER_KIND_LABELS[kind];
}
