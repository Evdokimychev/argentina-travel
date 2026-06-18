import { ARGENTINA_CITIES } from "@/data/argentina-cities";
import { SEARCH_DESTINATIONS } from "@/data/filters";
import {
  ARGENTINA_CITY_NAMES,
  normalizeTourDestinationValue,
  translateTourRegionLabel,
} from "@/lib/argentina-cities";

export const TOUR_COUNTRY_OPTIONS = [
  "Аргентина",
  "Бразилия",
  "Чили",
  "Уругвай",
  "Парагвай",
  "Боливия",
] as const;

export type TourCountry = (typeof TOUR_COUNTRY_OPTIONS)[number];

export const TOUR_CITY_OPTIONS = ARGENTINA_CITY_NAMES;

export const TOURIST_REGION_OPTIONS = Array.from(
  new Set([
    ...ARGENTINA_CITIES.map((city) => city.macroRegionRu),
    ...ARGENTINA_CITIES.map((city) => city.provinceRu),
    "Патагония",
    "Мисионес",
    "Буэнос-Айрес",
    "Мендоса",
    "Сальта",
    "Огненная Земля",
    "Месопотамия",
    "Литорал",
    "Куйо",
    "Центр",
    "Пампа",
  ])
).sort((a, b) => a.localeCompare(b, "ru"));

export const TOUR_LANDMARK_OPTIONS = SEARCH_DESTINATIONS.filter(
  (item) => item.type === "landmark" || item.type === "park"
)
  .map((item) => item.label)
  .sort((a, b) => a.localeCompare(b, "ru"));

export const DEFAULT_IGUAZU_MAP_START_POINT =
  "Провинция Мисионес, департамент Игуасу, аэропорт Катаратас-дель-Игуасу";

export function buildGeographySeed(input: {
  slug: string;
  country?: string;
  destination?: string;
  region?: string;
  startLocation?: string;
}) {
  const isIguazu = input.slug === "iguazu-falls";
  const destination = normalizeTourDestinationValue(
    isIguazu ? "Пуэрто-Игуасу" : input.destination
  );
  const region = translateTourRegionLabel(input.region);

  return {
    countries: [input.country ?? "Аргентина"],
    cities: destination ? [destination] : [],
    mainLocation: destination,
    touristRegions: region ? [region] : [],
    landmarks: isIguazu ? ["Национальный парк Игуасу"] : [],
    mapStartPoint: isIguazu
      ? DEFAULT_IGUAZU_MAP_START_POINT
      : input.startLocation ?? "",
  };
}
