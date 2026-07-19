import { CANONICAL_PLACE_REGIONS } from "@/data/places-planning";
import type { PlaceDetail, PlaceListing } from "@/types/place";

export type PlaceReadinessIssue = {
  slug: string;
  field: string;
  severity: "critical" | "warning";
  message: string;
};

export type PlaceReadinessReport = {
  total: number;
  ready: number;
  needsReview: number;
  issues: PlaceReadinessIssue[];
};

const ARGENTINA_BOUNDS = {
  minLatitude: -56,
  maxLatitude: -21,
  minLongitude: -74,
  maxLongitude: -53,
};

export function placeListingQualityScore(place: PlaceListing): number {
  let score = 35;
  if (place.coverImage) score += 15;
  if (place.shortDescription.trim().length >= 60) score += 10;
  if (place.season?.trim()) score += 10;
  if (place.visitDuration?.trim()) score += 10;
  if (place.tags.length >= 3) score += 10;
  if (place.province?.trim() || place.city?.trim()) score += 5;
  if (typeof place.rating === "number") score += 5;
  return Math.min(100, score);
}

export function auditPlaceCatalogReadiness(places: PlaceDetail[]): PlaceReadinessReport {
  const issues: PlaceReadinessIssue[] = [];
  const slugs = new Set<string>();
  const ids = new Set<string>();

  const add = (
    place: PlaceDetail,
    field: string,
    severity: PlaceReadinessIssue["severity"],
    message: string,
  ) => issues.push({ slug: place.slug, field, severity, message });

  for (const place of places) {
    if (slugs.has(place.slug)) add(place, "slug", "critical", "Слаг места дублируется");
    if (ids.has(place.id)) add(place, "id", "critical", "Идентификатор места дублируется");
    slugs.add(place.slug);
    ids.add(place.id);

    if (!(CANONICAL_PLACE_REGIONS as readonly string[]).includes(place.region)) {
      add(place, "region", "critical", "Регион не входит в единую таксономию карты");
    }
    if (
      place.latitude <= ARGENTINA_BOUNDS.minLatitude ||
      place.latitude >= ARGENTINA_BOUNDS.maxLatitude ||
      place.longitude <= ARGENTINA_BOUNDS.minLongitude ||
      place.longitude >= ARGENTINA_BOUNDS.maxLongitude
    ) {
      add(place, "coordinates", "critical", "Координаты находятся вне границ Аргентины");
    }
    if (place.shortDescription.trim().length < 35) {
      add(place, "shortDescription", "critical", "Карточке не хватает понятного краткого описания");
    }
    if (place.fullDescription.trim().length < 100) {
      add(place, "fullDescription", "critical", "Детальная страница содержит слишком мало текста");
    }
    if (!place.coverImage) add(place, "coverImage", "critical", "Нет собственной обложки места");
    if (place.gallery.length === 0) add(place, "gallery", "critical", "Нет ни одной фотографии");
    if (!place.season?.trim()) add(place, "season", "critical", "Не указан сезон поездки");
    if (!place.visitDuration?.trim()) {
      add(place, "visitDuration", "critical", "Не указано время на посещение");
    }
    if (!place.howToGetThere?.trim()) {
      add(place, "howToGetThere", "warning", "Нет практического описания дороги");
    }
    if (!place.faq || place.faq.length < 2) {
      add(place, "faq", "warning", "Нет ответов на основные вопросы поездки");
    }
    if (place.relatedPlaces.length === 0) {
      add(place, "relatedPlaces", "warning", "Место не связано с соседними объектами");
    }
  }

  const affected = new Set(issues.map((issue) => issue.slug));
  return {
    total: places.length,
    ready: places.length - affected.size,
    needsReview: affected.size,
    issues,
  };
}
