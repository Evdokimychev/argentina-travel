import {
  AccommodationType,
  ChildrenPolicy,
  DifficultyLevel,
  DurationBucket,
  GroupSizeBucket,
  TourLanguage,
} from "@/types";
import {
  getDestinationGallery,
  getDestinationImage,
  getDestinationImageAlt,
} from "@/lib/media-resolver";

export const SEARCH_DESTINATIONS = [
  { label: "Буэнос-Айрес", type: "city", region: "Буэнос-Айрес" },
  { label: "Барилоче", type: "city", region: "Патагония" },
  { label: "Эль-Калафате", type: "city", region: "Патагония" },
  { label: "Ушуайя", type: "city", region: "Огненная Земля" },
  { label: "Игуасу", type: "city", region: "Misiones" },
  { label: "Сальта", type: "city", region: "Сальта" },
  { label: "Мендоса", type: "city", region: "Мендоса" },
  { label: "Перито-Морено", type: "landmark", region: "Патагония" },
  { label: "Фitz Roy", type: "landmark", region: "Патагония" },
  { label: "Torres del Paine", type: "park", region: "Патагония" },
  { label: "Патагония", type: "region", region: "Патагония" },
  { label: "Национальный парк Иguacu", type: "park", region: "Misiones" },
] as const;

export const DATE_PRESETS = [
  { id: "weekend", label: "Ближайшие выходные" },
  { id: "july", label: "Июль" },
  { id: "august", label: "Август" },
  { id: "spring", label: "Весна" },
  { id: "summer", label: "Лето" },
  { id: "patagonia-autumn", label: "Осень в Патагонии" },
  { id: "andes-winter", label: "Зима в Андах" },
  { id: "new-year", label: "Новый год" },
  { id: "carnival", label: "Карнавал" },
] as const;

export { ACTIVITY_TYPES } from "@/data/activity-icons";
export { TOUR_COLLECTIONS, TOUR_COLLECTION_OPTIONS } from "@/data/tour-collections";
export { DIFFICULTY_LEVELS, DIFFICULTY_DOT_COUNT, DIFFICULTY_ICONS } from "@/data/tour-levels";

export const DURATION_OPTIONS: DurationBucket[] = [
  "1–2 дня",
  "2–3 дня",
  "4–7 дней",
  "8–14 дней",
  "15+ дней",
];

export const ACCOMMODATION_OPTIONS: AccommodationType[] = [
  "Без проживания",
  "Хостел",
  "Отель",
  "Бутик-отель",
  "Апартаменты",
  "Глэмпинг",
  "Палатка",
  "Горный приют",
  "Лодж",
  "Круизная каюта",
];

export { COMFORT_LEVELS as COMFORT_OPTIONS } from "@/data/tour-levels";

export const DIFFICULTY_OPTIONS: { level: DifficultyLevel; description: string }[] = [
  { level: "Лёгкая", description: "Подходит для всех." },
  { level: "Умеренная", description: "Короткие прогулки, минимальная нагрузка." },
  { level: "Средняя", description: "Умеренная физическая активность." },
  { level: "Высокая", description: "Нужна хорошая физическая форма." },
  { level: "Экстремальная", description: "Только для опытных путешественников." },
];

export const LANGUAGE_OPTIONS: TourLanguage[] = [
  "Русский",
  "Испанский",
  "Английский",
  "Португальский",
];

export const CHILDREN_OPTIONS: ChildrenPolicy[] = [
  "Без ограничений",
  "От 2 лет",
  "От 5 лет",
  "От 8 лет",
  "От 12 лет",
  "От 16 лет",
  "Только взрослые",
];

export const GROUP_SIZE_OPTIONS: GroupSizeBucket[] = [
  "Индивидуально",
  "До 4 человек",
  "До 8 человек",
  "До 12 человек",
  "До 20 человек",
  "Более 20 человек",
];

export const PRICE_MAX = 500000;

const POPULAR_DESTINATIONS_BASE = [
  {
    id: "ba",
    name: "Буэнос-Айрес",
    region: "Столица",
    description: "Танго, архитектура и гастрономия — идеальный старт маршрута",
    keywords: ["буэнос", "ba", "buenos aires", "реколета", "san telmo"],
  },
  {
    id: "bariloche",
    name: "Барилоче",
    region: "Патагония",
    description: "Озёра Nahuel Huapi, Cerro Catedral и шоколадные fabrikas",
    keywords: ["барилоче", "bariloche", "nahuel huapi", "catedral"],
  },
  {
    id: "calafate",
    name: "Эль-Калафате",
    region: "Патагония",
    description: "Ледник Perito Moreno и ледниковые трекинги",
    keywords: ["калафате", "calafate", "перито", "perito moreno", "ледник"],
  },
  {
    id: "ushuaia",
    name: "Ушуайя",
    region: "Огненная Земля",
    description: "Самый южный город мира и ворота в Антарктиду",
    keywords: ["ушуайя", "ushuaia", "огненная", "beagle", "антарктида"],
  },
  {
    id: "iguazu",
    name: "Игуасу",
    region: "Misiones",
    description: "275 водопадов и Garganta del Diablo — UNESCO",
    keywords: ["игуасу", "iguazu", "iguazú", "водопад", "misiones"],
  },
  {
    id: "mendoza",
    name: "Мендоса",
    region: "Анд",
    description: "Malbec, bodegas у подножия Aconcagua",
    keywords: ["мендоса", "mendoza", "malbec", "вино", "aconcagua"],
  },
  {
    id: "salta",
    name: "Сальта",
    region: "Северо-Запад",
    description: "Quebrada de Humahuaca, Cafayate и колониальный центр",
    keywords: ["сальта", "salta", "humahuaca", "cafayate", "каньон"],
  },
  {
    id: "patagonia",
    name: "Патагония",
    region: "Юг",
    description: "Ледники, Fitz Roy и бескрайние степи юга",
    keywords: ["патагония", "patagonia", "fitz roy", "chaltén", "valdés"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  region: string;
  description: string;
  keywords: readonly string[];
}>;

export const POPULAR_DESTINATIONS = POPULAR_DESTINATIONS_BASE.map((dest) => ({
  ...dest,
  keywords: [...dest.keywords],
  image: getDestinationImage(dest.id),
  imageAlt: getDestinationImageAlt(dest.id),
  gallery: getDestinationGallery(dest.id),
}));
