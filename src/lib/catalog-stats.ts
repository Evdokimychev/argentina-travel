import type { TourListing } from "@/types";
import { filterDefaultCatalogTours } from "@/lib/catalog-country-relevance";
import { resolveListingOwnerUserId } from "@/lib/organizer-public";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";
import { formatTours, toursWord } from "@/lib/pluralize";

/** Счётчики каталога туров по Аргентине (единый источник истины для UI). */
export interface CatalogStats {
  /** Авторские туры организаторов площадки */
  nativeCount: number;
  /** Партнёрские листинги (Tripster, YouTravel) */
  partnerCount: number;
  /** nativeCount + partnerCount */
  totalCount: number;
  /** Уникальные организаторы только среди авторских туров */
  organizerCount: number;
}

export function computeCatalogStats(tours: TourListing[]): CatalogStats {
  const argentina = filterDefaultCatalogTours(tours);
  const native = argentina.filter((tour) => !isPartnerTourListing(tour));
  const partner = argentina.filter((tour) => isPartnerTourListing(tour));
  const organizerIds = new Set(native.map((listing) => resolveListingOwnerUserId(listing)));

  return {
    nativeCount: native.length,
    partnerCount: partner.length,
    totalCount: argentina.length,
    organizerCount: organizerIds.size,
  };
}

/** Краткая строка для hero/CTA: «5 авторских и 41 партнёрский тур» или «5 туров». */
export function formatCatalogHeadline(stats: CatalogStats): string {
  if (stats.partnerCount <= 0) {
    return `${stats.totalCount} ${toursWord(stats.totalCount)}`;
  }
  return `${formatTours(stats.nativeCount)} на площадке и ${formatTours(stats.partnerCount)} партнёров`;
}

/** Пояснение под счётчиком каталога /about / stats block. */
export function formatCatalogStatsDetail(stats: CatalogStats): string {
  if (stats.partnerCount <= 0) {
    return "Авторские маршруты по Аргентине";
  }
  return `${formatTours(stats.nativeCount)} организаторов площадки и ${formatTours(stats.partnerCount)} от Tripster и YouTravel`;
}

/** Подсказка в /tours без активных фильтров. */
export function formatCatalogBrowseHint(stats: CatalogStats): string | null {
  if (stats.partnerCount <= 0) return null;
  return `В каталоге ${formatCatalogHeadline(stats)} — все маршруты по Аргентине`;
}
