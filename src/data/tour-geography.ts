import { POPULAR_DESTINATIONS, SEARCH_DESTINATIONS } from "@/data/filters";

export const TOUR_COUNTRY_OPTIONS = [
  "Аргентина",
  "Бразилия",
  "Чили",
  "Уругвай",
  "Парагвай",
  "Боливия",
] as const;

export type TourCountry = (typeof TOUR_COUNTRY_OPTIONS)[number];

const cityLabels = new Set<string>([
  "Пуэрто-Игуасу",
  ...SEARCH_DESTINATIONS.filter((item) => item.type === "city").map((item) => item.label),
  ...POPULAR_DESTINATIONS.map((item) => item.name),
]);

export const TOUR_CITY_OPTIONS = Array.from(cityLabels).sort((a, b) =>
  a.localeCompare(b, "ru")
);

export const TOURIST_REGION_OPTIONS = Array.from(
  new Set([
    ...SEARCH_DESTINATIONS.map((item) => item.region),
    ...POPULAR_DESTINATIONS.map((item) => item.region),
    "Патагония",
    "Misiones",
    "Буэнос-Айрес",
    "Мендоса",
    "Сальта",
    "Огненная Земля",
  ])
).sort((a, b) => a.localeCompare(b, "ru"));

export const TOUR_LANDMARK_OPTIONS = SEARCH_DESTINATIONS.filter(
  (item) => item.type === "landmark" || item.type === "park"
)
  .map((item) => item.label)
  .sort((a, b) => a.localeCompare(b, "ru"));

export const DEFAULT_IGUAZU_MAP_START_POINT =
  "Провинция де Мисионес, Департаменто Игуасу, аэропорт Катаратас дель Игуасу";

export function buildGeographySeed(input: {
  slug: string;
  country?: string;
  destination?: string;
  region?: string;
  startLocation?: string;
}) {
  const isIguazu = input.slug === "iguazu-waterfalls-day";

  return {
    countries: [input.country ?? "Аргентина"],
    cities: isIguazu
      ? ["Пуэрто-Игуасу"]
      : input.destination
        ? [input.destination]
        : [],
    mainLocation: isIguazu ? "Пуэрто-Игуасу" : input.destination ?? "",
    touristRegions: input.region ? [input.region] : [],
    landmarks: isIguazu ? ["Национальный парк Иguacu"] : [],
    mapStartPoint: isIguazu
      ? DEFAULT_IGUAZU_MAP_START_POINT
      : input.startLocation ?? "",
  };
}
