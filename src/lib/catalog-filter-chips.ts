import type { TourFilters, TourListing } from "@/types";
import type { CurrencyCode, LocaleCode } from "@/types/locale";
import type { ExcursionCatalogFilters } from "@/lib/excursion-catalog-filters";
import { EXCURSION_DURATION_OPTIONS } from "@/lib/excursion-catalog-filters";
import type { ExcursionCity } from "@/types/excursion";
import { isDurationFilterActive } from "@/data/duration-presets";
import { isPriceFilterActive } from "@/lib/tour-price-bounds";
import { getDefaultFilters } from "@/lib/filter-tours";
import { formatCurrencyAmount } from "@/lib/currency";
import { buildPublicOrganizerProfile } from "@/lib/organizer-public";
import type { CatalogFilterChip } from "@/components/marketplace/CatalogActiveFilterChips";

function formatRuDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function buildTourFilterChips(
  filters: TourFilters,
  onChange: (next: TourFilters) => void,
  options: {
    currency: CurrencyCode;
    locale: LocaleCode;
    tours: TourListing[];
  },
): CatalogFilterChip[] {
  const { currency, locale, tours } = options;
  const defaults = getDefaultFilters(currency, tours);
  const chips: CatalogFilterChip[] = [];

  const patch = (partial: Partial<TourFilters>) => onChange({ ...filters, ...partial });

  if (filters.query.trim()) {
    chips.push({
      id: "query",
      label: `Поиск: ${filters.query.trim()}`,
      onRemove: () => patch({ query: "" }),
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? formatRuDate(filters.dateFrom) : "…";
    const to = filters.dateTo ? formatRuDate(filters.dateTo) : "…";
    chips.push({
      id: "dates",
      label: `Даты: ${from} — ${to}`,
      onRemove: () => patch({ dateFrom: null, dateTo: null }),
    });
  }

  for (const type of filters.activityTypes) {
    chips.push({
      id: `activity:${type}`,
      label: type,
      onRemove: () =>
        patch({ activityTypes: filters.activityTypes.filter((item) => item !== type) }),
    });
  }

  if (isPriceFilterActive(filters.priceMin, filters.priceMax, currency, tours)) {
    const minLabel = formatCurrencyAmount(filters.priceMin, currency, locale);
    const maxLabel = formatCurrencyAmount(filters.priceMax, currency, locale);
    chips.push({
      id: "price",
      label: `Цена: ${minLabel} — ${maxLabel}`,
      onRemove: () => patch({ priceMin: defaults.priceMin, priceMax: defaults.priceMax }),
    });
  }

  if (isDurationFilterActive(filters)) {
    if (filters.dayTripsOnly) {
      chips.push({
        id: "day-trips",
        label: "Однодневные",
        onRemove: () => patch({ dayTripsOnly: false }),
      });
    }
    for (const bucket of filters.durations) {
      chips.push({
        id: `duration:${bucket}`,
        label: bucket,
        onRemove: () => patch({ durations: filters.durations.filter((item) => item !== bucket) }),
      });
    }
    if (filters.durationMin != null || filters.durationMax != null) {
      const min = filters.durationMin ?? 1;
      const max = filters.durationMax ?? "∞";
      chips.push({
        id: "duration-range",
        label: `Длительность: ${min}–${max} дн.`,
        onRemove: () => patch({ durationMin: null, durationMax: null }),
      });
    }
  }

  for (const item of filters.accommodations) {
    chips.push({
      id: `accommodation:${item}`,
      label: item,
      onRemove: () =>
        patch({ accommodations: filters.accommodations.filter((value) => value !== item) }),
    });
  }

  for (const item of filters.comfortLevels) {
    chips.push({
      id: `comfort:${item}`,
      label: item,
      onRemove: () =>
        patch({ comfortLevels: filters.comfortLevels.filter((value) => value !== item) }),
    });
  }

  for (const item of filters.difficultyLevels) {
    chips.push({
      id: `difficulty:${item}`,
      label: item,
      onRemove: () =>
        patch({ difficultyLevels: filters.difficultyLevels.filter((value) => value !== item) }),
    });
  }

  for (const item of filters.languages) {
    chips.push({
      id: `language:${item}`,
      label: item,
      onRemove: () => patch({ languages: filters.languages.filter((value) => value !== item) }),
    });
  }

  if (filters.childrenPolicy) {
    chips.push({
      id: "children",
      label: filters.childrenPolicy,
      onRemove: () => patch({ childrenPolicy: null }),
    });
  }

  for (const size of filters.groupSizes) {
    chips.push({
      id: `group-size:${size}`,
      label: size,
      onRemove: () => patch({ groupSizes: filters.groupSizes.filter((value) => value !== size) }),
    });
  }

  for (const format of filters.tourFormats) {
    chips.push({
      id: `format:${format}`,
      label: format === "group" ? "Групповой" : "Индивидуальный",
      onRemove: () =>
        patch({ tourFormats: filters.tourFormats.filter((value) => value !== format) }),
    });
  }

  if (filters.nearMe) {
    chips.push({
      id: "near-me",
      label: "Рядом со мной",
      onRemove: () => patch({ nearMe: false, userCoords: null }),
    });
  }

  if (filters.organizerSlug.trim()) {
    const profile = buildPublicOrganizerProfile(filters.organizerSlug.trim());
    chips.push({
      id: "organizer",
      label: profile ? `Организатор: ${profile.name}` : "Организатор",
      onRemove: () => patch({ organizerSlug: "" }),
    });
  }

  return chips;
}

export function buildExcursionFilterChips(
  filters: ExcursionCatalogFilters,
  onChange: (next: ExcursionCatalogFilters) => void,
  cities: ExcursionCity[],
): CatalogFilterChip[] {
  const chips: CatalogFilterChip[] = [];
  const patch = (partial: Partial<ExcursionCatalogFilters>) => onChange({ ...filters, ...partial });

  if (filters.query.trim()) {
    chips.push({
      id: "query",
      label: `Поиск: ${filters.query.trim()}`,
      onRemove: () => patch({ query: "" }),
    });
  }

  if (filters.citySlug) {
    const cityName = cities.find((city) => city.slug === filters.citySlug)?.name ?? filters.citySlug;
    chips.push({
      id: "city",
      label: cityName,
      onRemove: () => patch({ citySlug: "" }),
    });
  }

  for (const format of filters.formats) {
    chips.push({
      id: `format:${format}`,
      label: format === "individual" ? "Индивидуальная" : "Групповая",
      onRemove: () => patch({ formats: filters.formats.filter((item) => item !== format) }),
    });
  }

  for (const bucket of filters.durationBuckets) {
    const label =
      EXCURSION_DURATION_OPTIONS.find((option) => option.id === bucket)?.label ?? bucket;
    chips.push({
      id: `duration:${bucket}`,
      label,
      onRemove: () =>
        patch({
          durationBuckets: filters.durationBuckets.filter((item) => item !== bucket),
        }),
    });
  }

  if (filters.minRating != null) {
    chips.push({
      id: "rating",
      label: `От ${filters.minRating.toFixed(1)} ★`,
      onRemove: () => patch({ minRating: null }),
    });
  }

  if (filters.maxPrice != null) {
    chips.push({
      id: "price",
      label: `До $${filters.maxPrice}`,
      onRemove: () => patch({ maxPrice: null }),
    });
  }

  for (const partner of filters.partners) {
    chips.push({
      id: `partner:${partner}`,
      label: partner === "sputnik8" ? "Sputnik8" : "Tripster",
      onRemove: () => patch({ partners: filters.partners.filter((item) => item !== partner) }),
    });
  }

  return chips;
}
