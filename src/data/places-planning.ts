import type { PlaceCategory, PlaceFaqItem, PlaceListing } from "@/types/place";

export const CANONICAL_PLACE_REGIONS = [
  "Центр и Пампа",
  "Патагония",
  "Северо-запад",
  "Северо-восток",
  "Куйо",
  "Огненная Земля",
] as const;

export type CanonicalPlaceRegion = (typeof CANONICAL_PLACE_REGIONS)[number];

type PlacePlanningInput = Pick<
  PlaceListing,
  "name" | "category" | "region" | "province" | "city" | "season" | "visitDuration"
>;

const REGION_SEASONS: Record<CanonicalPlaceRegion, string> = {
  "Центр и Пампа": "Март–май и сентябрь–ноябрь; побережье — декабрь–март",
  Патагония: "Ноябрь–март; зимой доступ к отдельным маршрутам ограничен",
  "Северо-запад": "Апрель–октябрь; на высоте ночи остаются прохладными",
  "Северо-восток": "Апрель–октябрь; летом жарко, влажно и чаще идут ливни",
  Куйо: "Март–май и сентябрь–ноябрь; горные дороги зимой проверяйте заранее",
  "Огненная Земля": "Ноябрь–март; ветер и быстрая смена погоды возможны всегда",
};

const CATEGORY_DURATION: Record<PlaceCategory, string> = {
  national_park: "Полный день",
  waterfall: "Полный день",
  glacier: "Полный день",
  lake: "Полдня — 1 день",
  mountain: "Полный день",
  trekking: "Полный день",
  city: "1–2 дня",
  town: "1 день",
  beach: "1–2 дня",
  winery: "Полный день",
  museum: "2–4 часа",
  historic: "2–4 часа",
  viewpoint: "1–3 часа",
  reserve: "Полный день",
  wildlife: "Полный день",
};

function isCanonicalRegion(region: string): region is CanonicalPlaceRegion {
  return (CANONICAL_PLACE_REGIONS as readonly string[]).includes(region);
}

function resolveSeason(place: PlacePlanningInput): string {
  if (place.season?.trim()) return place.season.trim();
  if (place.category === "beach") return "Декабрь–март; в январе больше людей и выше цены";
  if (place.category === "winery") return "Март–май и сентябрь–ноябрь; дегустации бронируйте заранее";
  if (isCanonicalRegion(place.region)) return REGION_SEASONS[place.region];
  return "Сезонность зависит от маршрута; проверяйте погоду и доступ перед поездкой";
}

function resolveDuration(place: PlacePlanningInput): string {
  return place.visitDuration?.trim() || CATEGORY_DURATION[place.category];
}

function resolveBookingAdvice(category: PlaceCategory): string {
  if (["national_park", "reserve", "wildlife", "glacier", "trekking"].includes(category)) {
    return "Для охраняемых территорий, троп и экскурсий могут действовать квоты или регистрация. Перед выездом проверьте официальный сайт и условия доступа.";
  }
  if (category === "winery") {
    return "Да. Дегустации и обеды на винодельнях обычно проходят по записи, особенно в период сбора винограда и по выходным.";
  }
  if (category === "museum" || category === "historic") {
    return "Для обычного посещения чаще всего нет, но расписание, выходные дни и доступ на экскурсию лучше проверить на официальном сайте.";
  }
  return "В высокий сезон заранее бронируйте транспорт и проживание. Расписание конкретной достопримечательности проверяйте перед выездом.";
}

export function withPlacePlanningDefaults<T extends PlacePlanningInput>(place: T): T & {
  season: string;
  visitDuration: string;
} {
  return {
    ...place,
    season: resolveSeason(place),
    visitDuration: resolveDuration(place),
  };
}

export function getPlacePlanningHowToGetThere(place: PlacePlanningInput): string {
  const locality = place.city?.trim() || place.province?.trim() || place.region;
  return `Планируйте дорогу через ближайший транспортный узел — ${locality}. Последний участок до «${place.name}» и состояние дороги проверяйте перед выездом: расписание, погода и правила доступа могут меняться по сезону.`;
}

export function getPlacePlanningFaq(place: PlacePlanningInput): PlaceFaqItem[] {
  const planned = withPlacePlanningDefaults(place);
  return [
    {
      question: `Сколько времени заложить на ${place.name}?`,
      answer: `Ориентир — ${planned.visitDuration.toLowerCase()}. Добавьте запас, если едете из другого города или планируете прогулку без организованного трансфера.`,
    },
    {
      question: "Когда лучше ехать?",
      answer: `${planned.season}. Перед поездкой проверьте прогноз и актуальный режим работы.`,
    },
    {
      question: "Нужно ли бронировать посещение заранее?",
      answer: resolveBookingAdvice(place.category),
    },
  ];
}

export function completePlacePlanningFaq(
  place: PlacePlanningInput,
  editorialFaq: PlaceFaqItem[] | undefined,
): PlaceFaqItem[] {
  const combined = [...(editorialFaq ?? []), ...getPlacePlanningFaq(place)];
  const seen = new Set<string>();
  return combined.filter((item) => {
    const key = item.question.trim().toLocaleLowerCase("ru");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return item.answer.trim().length > 0;
  });
}
