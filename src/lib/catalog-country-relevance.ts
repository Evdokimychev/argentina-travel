import type { TourListing } from "@/types";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";

const ARGENTINA_MARKERS = ["аргентина", "argentina"];

/** Основная страна — соседняя; показываем только по opt-in фильтру. */
const NEIGHBORING_PRIMARY_MARKERS = [
  "бразил",
  "brazil",
  "парагв",
  "paraguay",
  "уругв",
  "uruguay",
  "чили",
  "chile",
  "болив",
  "bolivia",
];

/**
 * Признаки, что Аргентина — значимая часть маршрута (трансграничные туры).
 * Пример: водопады Игуасу с бразильской стороны, Патагония, Ушуайя.
 */
const CROSS_BORDER_ARGENTINA_MARKERS = [
  "iguazu",
  "iguassu",
  "iguaçu",
  "iguacu",
  "игуасу",
  "foz do igua",
  "foz do iguacu",
  "patagonia",
  "патагони",
  "ushuaia",
  "ушуайя",
  "tierra del fuego",
  "огненная земля",
  "el calafate",
  "калафате",
  "perito moreno",
  "перито",
  "los glaciares",
  "bariloche",
  "барилоче",
  "salta",
  "сальта",
  "mendoza",
  "мендоса",
  "buenos aires",
  "бuenос",
  "jujuy",
  "жужуй",
  "cafayate",
  "кафаяте",
];

function tourLocationHaystack(tour: TourListing): string {
  return [tour.destination, tour.region, tour.title, tour.shortDescription, ...(tour.partnerThematicTags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function tourCrossBorderHaystack(tour: TourListing): string {
  return [tour.title, tour.destination, tour.shortDescription, ...(tour.partnerThematicTags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function includesAny(haystack: string, markers: readonly string[]): boolean {
  return markers.some((marker) => haystack.includes(marker));
}

function normalizeCountryLabel(value: string): string {
  return value.trim().toLowerCase();
}

/** Первая страна из поля country (если несколько через запятую). */
export function getTourPrimaryCountry(tour: TourListing): string | null {
  const raw = tour.country?.trim();
  if (!raw) return null;
  return raw.split(",")[0]?.trim() || null;
}

export function isArgentinaCountryLabel(label: string): boolean {
  const normalized = normalizeCountryLabel(label);
  return ARGENTINA_MARKERS.some((marker) => normalized.includes(marker));
}

export function isNeighboringPrimaryCountryLabel(label: string): boolean {
  const normalized = normalizeCountryLabel(label);
  return NEIGHBORING_PRIMARY_MARKERS.some((marker) => normalized.includes(marker));
}

/** Аргентина явно или трансграничный маршрут с опорой на Аргентину. */
export function hasArgentinaCatalogRelevance(tour: TourListing): boolean {
  const countryHaystack = [tour.country].filter(Boolean).join(" ").toLowerCase();
  if (includesAny(countryHaystack, ARGENTINA_MARKERS)) return true;

  const primary = getTourPrimaryCountry(tour);
  const crossBorderHaystack =
    primary && isNeighboringPrimaryCountryLabel(primary) && !isArgentinaCountryLabel(primary)
      ? tourCrossBorderHaystack(tour)
      : tourLocationHaystack(tour);

  return includesAny(crossBorderHaystack, CROSS_BORDER_ARGENTINA_MARKERS);
}

/**
 * Тур с основной страной-соседом без аргентинской релевантности
 * (карнавал в Рио, Парагвай-only и т.п.).
 */
export function isNeighboringCountryTour(tour: TourListing): boolean {
  const primary = getTourPrimaryCountry(tour);
  if (!primary || isArgentinaCountryLabel(primary)) return false;
  if (!isNeighboringPrimaryCountryLabel(primary)) return false;
  return !hasArgentinaCatalogRelevance(tour);
}

/** Дефолтный каталог /tours и витрина — про Аргентину + релевантные трансграничные. */
export function isDefaultCatalogTour(tour: TourListing): boolean {
  const primary = getTourPrimaryCountry(tour);

  if (!isPartnerTourListing(tour)) {
    if (!primary) return true;
    if (isArgentinaCountryLabel(primary)) return true;
    return hasArgentinaCatalogRelevance(tour);
  }

  if (!primary) return true;
  if (isArgentinaCountryLabel(primary)) return true;
  if (hasArgentinaCatalogRelevance(tour)) return true;

  return false;
}

export function filterDefaultCatalogTours(tours: TourListing[]): TourListing[] {
  return tours.filter(isDefaultCatalogTour);
}

export function filterNeighboringCountryTours(tours: TourListing[]): TourListing[] {
  return tours.filter(isNeighboringCountryTour);
}

export function matchesCatalogCountryScope(
  tour: TourListing,
  includeNeighboringCountries: boolean
): boolean {
  if (isDefaultCatalogTour(tour)) return true;
  if (includeNeighboringCountries && isNeighboringCountryTour(tour)) return true;
  return false;
}

/** @deprecated alias — используйте isDefaultCatalogTour */
export function isArgentinaHomepageTour(tour: TourListing): boolean {
  return isDefaultCatalogTour(tour);
}

/** @deprecated alias — используйте filterDefaultCatalogTours */
export function filterArgentinaHomepageTours(tours: TourListing[]): TourListing[] {
  return filterDefaultCatalogTours(tours);
}
