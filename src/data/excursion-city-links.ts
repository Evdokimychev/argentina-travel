/** Tripster city slugs synced from API (see tripster_cities.slug). */
export const EXCURSION_CITY_LINKS = {
  buenosAires: { slug: "Buenos_Aires", label: "Буэнос-Айрес" },
  ushuaia: { slug: "Ushuaia", label: "Ушуайя" },
  mendoza: { slug: "Mendoza", label: "Мендоса" },
  iguazu: { slug: "Puerto_Iguazu", label: "Пуэрто-Игуасу" },
  puertoMadryn: { slug: "Puerto_Madryn", label: "Пуэрто-Мадрин" },
} as const;

/** Sputnik8 city slug → canonical catalog slug (Tripster-style). */
export const SPUTNIK8_CITY_SLUG_MAP: Record<string, string> = {
  "buenos-aires": EXCURSION_CITY_LINKS.buenosAires.slug,
  buenos_aires: EXCURSION_CITY_LINKS.buenosAires.slug,
  "buenos aires": EXCURSION_CITY_LINKS.buenosAires.slug,
  ushuaia: EXCURSION_CITY_LINKS.ushuaia.slug,
  mendoza: EXCURSION_CITY_LINKS.mendoza.slug,
  "puerto-iguazu": EXCURSION_CITY_LINKS.iguazu.slug,
  puerto_iguazu: EXCURSION_CITY_LINKS.iguazu.slug,
  "puerto iguazu": EXCURSION_CITY_LINKS.iguazu.slug,
  "puerto-madryn": EXCURSION_CITY_LINKS.puertoMadryn.slug,
  puerto_madryn: EXCURSION_CITY_LINKS.puertoMadryn.slug,
  "puerto madryn": EXCURSION_CITY_LINKS.puertoMadryn.slug,
  bariloche: "Bariloche",
  "san-carlos-de-bariloche": "Bariloche",
  salta: "Salta",
  cordoba: "Cordoba",
  "el-calafate": "El_Calafate",
  rosario: "Rosario",
};

const CITY_NAME_TO_CANONICAL_SLUG: Record<string, string> = {
  "buenos aires": EXCURSION_CITY_LINKS.buenosAires.slug,
  "буэнос-айрес": EXCURSION_CITY_LINKS.buenosAires.slug,
  "бuenос-айрес": EXCURSION_CITY_LINKS.buenosAires.slug,
  ushuaia: EXCURSION_CITY_LINKS.ushuaia.slug,
  ушуайя: EXCURSION_CITY_LINKS.ushuaia.slug,
  mendoza: EXCURSION_CITY_LINKS.mendoza.slug,
  мендоса: EXCURSION_CITY_LINKS.mendoza.slug,
  "puerto iguazu": EXCURSION_CITY_LINKS.iguazu.slug,
  "puerto iguazú": EXCURSION_CITY_LINKS.iguazu.slug,
  "пуэрто-игуасу": EXCURSION_CITY_LINKS.iguazu.slug,
  "puerto madryn": EXCURSION_CITY_LINKS.puertoMadryn.slug,
  "пуэрто-мадрин": EXCURSION_CITY_LINKS.puertoMadryn.slug,
  bariloche: "Bariloche",
  "san carlos de bariloche": "Bariloche",
  salta: "Salta",
  cordoba: "Cordoba",
  córdoba: "Cordoba",
  "el calafate": "El_Calafate",
  rosario: "Rosario",
};

function normalizeCityLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function resolveCanonicalCitySlugFromNames(
  ...names: (string | null | undefined)[]
): string | null {
  for (const name of names) {
    if (!name?.trim()) continue;
    const hit = CITY_NAME_TO_CANONICAL_SLUG[normalizeCityLookupKey(name)];
    if (hit) return hit;
  }
  return null;
}

export function resolveCanonicalCitySlug(
  rawSlug: string,
  partner: "tripster" | "sputnik8" = "tripster"
): string {
  const normalized = rawSlug.trim();
  if (!normalized) return normalized;

  if (partner === "tripster") return normalized;

  const lower = normalized.toLowerCase();
  return SPUTNIK8_CITY_SLUG_MAP[lower] ?? normalized;
}

/** Unify Tripster + Sputnik8 city slugs (Sputnik8 often has `city-{id}` placeholders). */
export function normalizeExcursionCitySlug(
  slug: string | null | undefined,
  ...names: (string | null | undefined)[]
): string {
  const trimmed = slug?.trim();
  if (trimmed && !/^city-\d+$/i.test(trimmed)) {
    return resolveCanonicalCitySlug(trimmed, "sputnik8");
  }

  const fromName = resolveCanonicalCitySlugFromNames(...names);
  if (fromName) return fromName;

  return trimmed || "argentina";
}

export function excursionCityMergeKey(city: { slug: string; name: string }): string {
  return normalizeExcursionCitySlug(city.slug, city.name).toLowerCase();
}

export function excursionCityHref(citySlug: string): string {
  return `/excursions/city/${encodeURIComponent(citySlug)}`;
}

/** Map destination page ids → Tripster city slug when available. */
export const DESTINATION_EXCURSION_CITY: Record<string, string> = {
  ba: EXCURSION_CITY_LINKS.buenosAires.slug,
  ushuaia: EXCURSION_CITY_LINKS.ushuaia.slug,
  mendoza: EXCURSION_CITY_LINKS.mendoza.slug,
  iguazu: EXCURSION_CITY_LINKS.iguazu.slug,
};

export function destinationExcursionsHref(destinationId: string): string | null {
  const citySlug = DESTINATION_EXCURSION_CITY[destinationId];
  if (citySlug) return excursionCityHref(citySlug);
  return null;
}
