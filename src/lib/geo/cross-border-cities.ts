import type { GeoCountryCode } from "./types";
import { normalizeLocationKey } from "./locations";

type CrossBorderCityEntry = {
  markers: readonly string[];
  countryRu: string;
  countryCode: GeoCountryCode;
};

/** Known cities outside Argentina that must not inherit the Argentina default. */
const CROSS_BORDER_CITY_ENTRIES: readonly CrossBorderCityEntry[] = [
  {
    markers: ["sao paulo", "são paulo", "san-paulu", "сан-паулу", "san paulu"],
    countryRu: "Бразилия",
    countryCode: "BR",
  },
  {
    markers: [
      "foz do iguacu",
      "foz do iguaçu",
      "foz do iguasu",
      "фос-ду-игуасу",
      "фос ду игуасу",
    ],
    countryRu: "Бразилия",
    countryCode: "BR",
  },
  {
    markers: ["rio de janeiro", "рио-де-жанейро"],
    countryRu: "Бразилия",
    countryCode: "BR",
  },
  {
    markers: ["montevideo", "монтевидео"],
    countryRu: "Уругвай",
    countryCode: "UY",
  },
  {
    markers: ["santiago de chile", "santiago", "сантьяго"],
    countryRu: "Чили",
    countryCode: "CL",
  },
  {
    markers: ["asuncion", "asunción", "асунсьон"],
    countryRu: "Парагвай",
    countryCode: "PY",
  },
];

function stripTrailingCountry(label: string): string {
  return label.replace(/,\s*[^,]+$/u, "").trim();
}

export function inferCountryFromLocationName(input?: string | null): {
  countryRu: string;
  countryCode: GeoCountryCode;
} | null {
  if (!input?.trim()) return null;

  const normalized = normalizeLocationKey(stripTrailingCountry(input));
  if (!normalized) return null;

  for (const entry of CROSS_BORDER_CITY_ENTRIES) {
    if (entry.markers.some((marker) => normalized.includes(normalizeLocationKey(marker)))) {
      return { countryRu: entry.countryRu, countryCode: entry.countryCode };
    }
  }

  return null;
}

export function resolveTourCountryLabel(input: {
  country?: string | null;
  destination?: string | null;
  mainLocation?: string | null;
  region?: string | null;
  cities?: string[] | null;
}): string {
  const explicit = input.country?.trim();
  if (explicit) return explicit.split(",")[0]?.trim() || explicit;

  const candidates = [
    input.destination,
    input.mainLocation,
    ...(input.cities ?? []),
    input.region,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const inferred = inferCountryFromLocationName(candidate);
    if (inferred) return inferred.countryRu;
  }

  return "Аргентина";
}
