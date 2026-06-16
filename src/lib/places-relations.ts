import type { PlaceListing, PlaceRelation, PlaceRelationType } from "@/types/place";

const EARTH_RADIUS_KM = 6371;

/** Haversine distance between two coordinates in km. */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function tagOverlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map((t) => t.toLowerCase()));
  const overlap = a.filter((t) => setB.has(t.toLowerCase())).length;
  return overlap / Math.max(a.length, b.length);
}

export type BuildRelationsOptions = {
  maxResults?: number;
  maxDistanceKm?: number;
};

/**
 * Builds a related-places graph from geography, tags, category, and region.
 * Used for detail pages and future AI itinerary suggestions.
 */
export function buildPlaceRelations(
  source: PlaceListing,
  candidates: PlaceListing[],
  options: BuildRelationsOptions = {},
): PlaceRelation[] {
  const { maxResults = 8, maxDistanceKm = 500 } = options;
  const relations: PlaceRelation[] = [];

  for (const candidate of candidates) {
    if (candidate.slug === source.slug) continue;

    const distanceKm = haversineDistanceKm(
      source.latitude,
      source.longitude,
      candidate.latitude,
      candidate.longitude,
    );

    if (candidate.region === source.region) {
      relations.push({
        place: candidate,
        type: "region",
        score: 0.6 + tagOverlapScore(source.tags, candidate.tags) * 0.2,
        distanceKm,
        reason: `Тот же регион: ${source.region}`,
      });
    }

    if (candidate.category === source.category) {
      relations.push({
        place: candidate,
        type: "category",
        score: 0.5 + tagOverlapScore(source.tags, candidate.tags) * 0.15,
        distanceKm,
        reason: `Та же категория`,
      });
    }

    const tagScore = tagOverlapScore(source.tags, candidate.tags);
    if (tagScore >= 0.25) {
      relations.push({
        place: candidate,
        type: "tag",
        score: 0.4 + tagScore * 0.5,
        distanceKm,
        reason: "Общие темы",
      });
    }

    if (distanceKm <= maxDistanceKm) {
      const geoScore = Math.max(0, 1 - distanceKm / maxDistanceKm);
      if (geoScore >= 0.3) {
        relations.push({
          place: candidate,
          type: distanceKm <= 50 ? "geographic" : "distance",
          score: 0.35 + geoScore * 0.45,
          distanceKm,
          reason:
            distanceKm <= 50
              ? `Рядом (~${Math.round(distanceKm)} км)`
              : `В радиусе ~${Math.round(distanceKm)} км`,
        });
      }
    }
  }

  const bySlug = new Map<string, PlaceRelation>();

  for (const rel of relations) {
    const existing = bySlug.get(rel.place.slug);
    if (!existing || rel.score > existing.score) {
      bySlug.set(rel.place.slug, rel);
    }
  }

  return [...bySlug.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export function mergeRelationTypes(relations: PlaceRelation[]): PlaceRelationType[] {
  return [...new Set(relations.map((r) => r.type))];
}
