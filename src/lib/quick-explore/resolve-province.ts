import { ARGENTINA_CITIES } from "@/data/argentina-cities";
import { PROVINCE_LABELS_RU } from "@/data/map-thematic/province-labels";
import { QUICK_EXPLORE_PROVINCE_BY_ISO } from "@/data/quick-explore/province-registry";
import { PLACE_TO_KB_ID } from "@/data/kb-place-id-map";
import type { PlaceCategory, PlaceListing } from "@/types/place";

const PROVINCE_NAME_TO_ISO: Record<string, string> = {
  "buenos aires": "AR-B",
  "ciudad autonoma de buenos aires": "AR-C",
  "autonomous city of buenos aires": "AR-C",
  caba: "AR-C",
  "la pampa": "AR-L",
  "santa fe": "AR-S",
  "entre rios": "AR-E",
  cordoba: "AR-X",
  "córdoba": "AR-X",
  mendoza: "AR-M",
  "san juan": "AR-J",
  "san luis": "AR-D",
  salta: "AR-A",
  jujuy: "AR-Y",
  tucuman: "AR-T",
  tucumán: "AR-T",
  catamarca: "AR-K",
  "la rioja": "AR-F",
  "santiago del estero": "AR-G",
  misiones: "AR-N",
  corrientes: "AR-W",
  chaco: "AR-H",
  formosa: "AR-P",
  "rio negro": "AR-R",
  "río negro": "AR-R",
  neuquen: "AR-Q",
  neuquén: "AR-Q",
  chubut: "AR-U",
  "santa cruz": "AR-Z",
  "tierra del fuego": "AR-V",
};

function normalizeProvinceKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const RU_PROVINCE_TO_ISO: Record<string, string> = {};
for (const [iso, labels] of Object.entries(PROVINCE_LABELS_RU)) {
  RU_PROVINCE_TO_ISO[normalizeProvinceKey(labels.nameRu)] = iso;
  const short = labels.nameRu
    .replace(/^Провинция\s+/i, "")
    .replace(/^Автономный город\s+/i, "");
  RU_PROVINCE_TO_ISO[normalizeProvinceKey(short)] = iso;
}

function resolveProvinceIsoFromText(text: string): string | null {
  const key = normalizeProvinceKey(text);
  if (PROVINCE_NAME_TO_ISO[key]) return PROVINCE_NAME_TO_ISO[key];
  if (RU_PROVINCE_TO_ISO[key]) return RU_PROVINCE_TO_ISO[key];

  for (const [name, iso] of Object.entries(PROVINCE_NAME_TO_ISO)) {
    if (key.includes(name) || name.includes(key)) return iso;
  }
  for (const [name, iso] of Object.entries(RU_PROVINCE_TO_ISO)) {
    if (key.includes(name) || name.includes(key)) return iso;
  }
  return null;
}

const CITY_SLUG_TO_ISO = Object.fromEntries(
  ARGENTINA_CITIES.map((city) => {
    const iso = resolveProvinceIsoFromText(city.provinceRu);
    return iso ? [city.slug, iso] : [];
  }).filter((entry): entry is [string, string] => entry.length === 2)
) as Record<string, string>;

const SLUG_TO_ISO: Record<string, string> = {
  "buenos-aires": "AR-C",
  bariloche: "AR-R",
  "el-calafate": "AR-Z",
  ushuaia: "AR-V",
  mendoza: "AR-M",
  salta: "AR-A",
  "san-martin-de-los-andes": "AR-Q",
  cordoba: "AR-X",
  "iguazu-falls": "AR-N",
  ...CITY_SLUG_TO_ISO,
};

export function resolveProvinceIso(province?: string | null, slug?: string): string | null {
  if (province) {
    const primary = province.split("·")[0]?.split("/")[0]?.trim() ?? province;
    const iso = resolveProvinceIsoFromText(primary);
    if (iso) return iso;
  }
  if (slug && SLUG_TO_ISO[slug]) return SLUG_TO_ISO[slug];
  return null;
}

export function placeKindToExploreKind(
  category: PlaceCategory
): "city" | "national_park" | "attraction" {
  if (category === "city" || category === "town") return "city";
  if (category === "national_park") return "national_park";
  return "attraction";
}

export function kbIdForPlaceSlug(slug: string): string | undefined {
  return PLACE_TO_KB_ID[slug];
}

export function provinceDef(iso: string) {
  return QUICK_EXPLORE_PROVINCE_BY_ISO[iso];
}

export function sortPlacesForExplore(a: PlaceListing, b: PlaceListing): number {
  const score = (p: PlaceListing) => {
    let s = p.popularity ?? 0;
    if (p.category === "national_park") s += 20;
    if (p.category === "city") s += 5;
    return s;
  };
  return score(b) - score(a);
}

export function sortExploreSpotsByTitle<T extends { title: string; kind: string }>(a: T, b: T): number {
  const kindOrder = { national_park: 0, city: 1, attraction: 2 };
  const ka = kindOrder[a.kind as keyof typeof kindOrder] ?? 3;
  const kb = kindOrder[b.kind as keyof typeof kindOrder] ?? 3;
  if (ka !== kb) return ka - kb;
  return a.title.localeCompare(b.title, "ru");
}
