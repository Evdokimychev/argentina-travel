import registry from "@/data/map-barrios/caba-barrios-registry.json";

export type CabaBarrioAudience =
  | "tourist"
  | "nomad"
  | "relocate"
  | "family"
  | "budget"
  | "luxury"
  | "local"
  | "transit"
  | "sightseeing";

export type CabaBarrioRecord = {
  slug: string;
  nameRu: string;
  nameEs: string;
  comuna: number;
  comunaLabel: string;
  recommendedForStay: boolean;
  recommendedPriority: 0 | 1 | 2;
  audience: CabaBarrioAudience[];
  priceLevel: 1 | 2 | 3 | 4;
  description: string;
  safetyNote?: string;
  osmKeys: string[];
};

export const CABA_BARRIOS: CabaBarrioRecord[] = registry as CabaBarrioRecord[];

export const CABA_BARRIOS_BY_SLUG = Object.fromEntries(
  CABA_BARRIOS.map((barrio) => [barrio.slug, barrio])
) as Record<string, CabaBarrioRecord>;

/** Центр CABA и границы для встраиваемой карты районов. */
export const CABA_MAP_VIEW = {
  center: [-58.435, -34.603] as [number, number],
  zoom: 12,
  minZoom: 10,
  maxZoom: 16,
  bounds: [
    [-58.53, -34.71],
    [-58.32, -34.52],
  ] as [[number, number], [number, number]],
};

const PRICE_LABELS: Record<number, string> = {
  1: "бюджетный",
  2: "средний",
  3: "выше среднего",
  4: "премиум",
};

const AUDIENCE_LABELS: Record<CabaBarrioAudience, string> = {
  tourist: "туристам",
  nomad: "кочевникам",
  relocate: "релокации",
  family: "семьям",
  budget: "бюджет",
  luxury: "комфорт",
  local: "местным",
  transit: "транзит",
  sightseeing: "экскурсии",
};

function normalizeOsmName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Сопоставление названия OSM с записью реестра CABA. */
export function matchCabaBarrio(osmName: string): CabaBarrioRecord | null {
  const normalized = normalizeOsmName(osmName);
  if (!normalized) return null;

  for (const barrio of CABA_BARRIOS) {
    if (barrio.osmKeys.some((key) => normalized === key || normalized.includes(key))) {
      return barrio;
    }
  }
  return null;
}

export function enrichBarrioProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const slug = String(properties.slug ?? properties.barrioSlug ?? "");
  const barrio = slug ? CABA_BARRIOS_BY_SLUG[slug] : null;
  const nameRu = String(properties.nameRu ?? barrio?.nameRu ?? properties.name ?? "Район");
  const audience = (properties.audience as CabaBarrioAudience[] | undefined) ?? barrio?.audience ?? [];
  const priceLevel = Number(properties.priceLevel ?? barrio?.priceLevel ?? 2);

  return {
    ...properties,
    slug: slug || barrio?.slug,
    nameRu,
    name: nameRu,
    nameEs: barrio?.nameEs ?? properties.nameEs,
    comuna: barrio?.comuna ?? properties.comuna,
    comunaLabel: properties.comunaLabel ?? barrio?.comunaLabel ?? "",
    recommended: properties.recommended ?? barrio?.recommendedForStay ?? false,
    recommendedForStay: properties.recommendedForStay ?? barrio?.recommendedForStay ?? false,
    recommendedPriority: properties.recommendedPriority ?? barrio?.recommendedPriority ?? 0,
    description: properties.description ?? barrio?.description ?? "",
    safetyNote: properties.safetyNote ?? barrio?.safetyNote ?? "",
    audience,
    audienceLabel: audience.map((a) => AUDIENCE_LABELS[a] ?? a).join(", "),
    priceLevel,
    priceLabel: PRICE_LABELS[priceLevel] ?? "",
  };
}

export function isRecommendedBarrio(properties: Record<string, unknown>): boolean {
  return properties.recommendedForStay === true || properties.recommended === true;
}

export const CABA_RECOMMENDED_COUNT = CABA_BARRIOS.filter((b) => b.recommendedForStay).length;
