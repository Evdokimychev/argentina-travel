import { PROVINCE_LABELS_RU } from "@/data/map-thematic/province-labels";

/** 24 провинции — центры карты для быстрого исследования. */
export type QuickExploreProvinceDef = {
  iso: string;
  slug: string;
  nameRu: string;
  macroRegionRu: string;
  /** [lng, lat] */
  center: [number, number];
  zoom: number;
};

const CENTERS: Record<string, { slug: string; center: [number, number]; zoom: number }> = {
  "AR-C": { slug: "caba", center: [-58.435, -34.603], zoom: 11 },
  "AR-B": { slug: "buenos-aires", center: [-57.95, -34.92], zoom: 8 },
  "AR-L": { slug: "la-pampa", center: [-64.28, -36.62], zoom: 7 },
  "AR-S": { slug: "santa-fe", center: [-60.7, -31.63], zoom: 7 },
  "AR-E": { slug: "entre-rios", center: [-60.0, -31.73], zoom: 7 },
  "AR-X": { slug: "cordoba", center: [-64.19, -31.42], zoom: 7 },
  "AR-M": { slug: "mendoza", center: [-68.83, -32.89], zoom: 7 },
  "AR-J": { slug: "san-juan", center: [-68.52, -31.54], zoom: 7 },
  "AR-D": { slug: "san-luis", center: [-66.34, -33.3], zoom: 7 },
  "AR-A": { slug: "salta", center: [-65.41, -24.78], zoom: 7 },
  "AR-Y": { slug: "jujuy", center: [-65.3, -24.19], zoom: 8 },
  "AR-T": { slug: "tucuman", center: [-65.22, -26.82], zoom: 8 },
  "AR-K": { slug: "catamarca", center: [-65.78, -28.47], zoom: 7 },
  "AR-F": { slug: "la-rioja", center: [-66.86, -29.41], zoom: 7 },
  "AR-G": { slug: "santiago-del-estero", center: [-64.26, -27.78], zoom: 7 },
  "AR-N": { slug: "misiones", center: [-55.9, -27.37], zoom: 7 },
  "AR-W": { slug: "corrientes", center: [-58.83, -27.47], zoom: 7 },
  "AR-H": { slug: "chaco", center: [-60.95, -26.82], zoom: 7 },
  "AR-P": { slug: "formosa", center: [-58.18, -26.18], zoom: 7 },
  "AR-R": { slug: "rio-negro", center: [-68.06, -40.81], zoom: 6 },
  "AR-Q": { slug: "neuquen", center: [-68.06, -38.95], zoom: 7 },
  "AR-U": { slug: "chubut", center: [-65.1, -43.25], zoom: 6 },
  "AR-Z": { slug: "santa-cruz", center: [-69.22, -51.62], zoom: 5 },
  "AR-V": { slug: "tierra-del-fuego", center: [-68.3, -54.8], zoom: 6 },
};

export const QUICK_EXPLORE_PROVINCES: QuickExploreProvinceDef[] = Object.entries(
  PROVINCE_LABELS_RU
).map(([iso, labels]) => {
  const geo = CENTERS[iso]!;
  return {
    iso,
    slug: geo.slug,
    nameRu: labels.nameRu,
    macroRegionRu: labels.macroRegionRu,
    center: geo.center,
    zoom: geo.zoom,
  };
});

export const QUICK_EXPLORE_PROVINCE_BY_ISO = Object.fromEntries(
  QUICK_EXPLORE_PROVINCES.map((p) => [p.iso, p])
) as Record<string, QuickExploreProvinceDef>;
