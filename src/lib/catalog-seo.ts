import type { Metadata } from "next";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { TourListing } from "@/types";
import { filterTours } from "@/lib/filter-tours";
import { sortTours } from "@/lib/sort-tours";
import {
  parseCatalogFiltersFromSearchParams,
  parseCatalogSortFromSearchParams,
} from "@/lib/catalog-filter-url";
import { buildPublicOrganizerProfile } from "@/lib/organizer-public";

const DEFAULT_CURRENCY = "RUB" as const;

function toSearchParams(
  input: Record<string, string | string[] | undefined>
): ReadonlyURLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  }
  return params as ReadonlyURLSearchParams;
}

function describeActiveFilters(
  params: ReadonlyURLSearchParams,
  tours: TourListing[]
): string[] {
  const filters = parseCatalogFiltersFromSearchParams(params, DEFAULT_CURRENCY, tours);
  const parts: string[] = [];

  if (filters.query.trim()) parts.push(`поиск «${filters.query.trim()}»`);
  if (filters.organizerSlug.trim()) {
    const profile = buildPublicOrganizerProfile(filters.organizerSlug.trim());
    parts.push(`организатор ${profile?.name ?? filters.organizerSlug}`);
  }
  if (filters.activityTypes.length) {
    parts.push(filters.activityTypes.join(", "));
  }
  if (filters.dateFrom || filters.dateTo) parts.push("выбранные даты");

  return parts;
}

export function getServerCatalogView(
  searchParams: Record<string, string | string[] | undefined>,
  tours: TourListing[]
) {
  const params = toSearchParams(searchParams);
  const filters = parseCatalogFiltersFromSearchParams(params, DEFAULT_CURRENCY, tours);
  const sort = parseCatalogSortFromSearchParams(params);
  const filtered = filterTours(tours, filters, DEFAULT_CURRENCY);
  const sorted = sortTours(filtered, sort);

  return { filters, sort, filtered: sorted, total: tours.length };
}

export function buildCatalogMetadata(
  searchParams: Record<string, string | string[] | undefined>,
  tours: TourListing[]
): Metadata {
  const params = toSearchParams(searchParams);
  const view = getServerCatalogView(searchParams, tours);
  const filterParts = describeActiveFilters(params, tours);
  const count = view.filtered.length;

  const baseTitle = "Каталог туров по Аргентине";
  const title =
    filterParts.length > 0
      ? `${baseTitle} — ${filterParts.slice(0, 2).join(", ")}`
      : baseTitle;

  const description =
    filterParts.length > 0
      ? `${count} ${count === 1 ? "тур" : count < 5 ? "тура" : "туров"} по фильтрам: ${filterParts.join(", ")}. Авторские путешествия с удобным поиском и бронированием.`
      : `${count} авторских туров и экскурсий по Аргентине — от Буэнос-Айреса до Патагонии. Фильтры по датам, цене, формату и региону.`;

  const canonicalQuery = params.toString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalQuery ? `/tours?${canonicalQuery}` : "/tours",
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}
