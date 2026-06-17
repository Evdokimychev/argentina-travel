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
  {
    label: "Аргентина",
    type: "country",
    region: "Аргентина",
    description: "Туры по всей стране — от столицы до Патагонии",
    keywords: ["argentina", "арgentina", "аргент"],
  },
  {
    label: "Буэнос-Айрес",
    type: "city",
    region: "Буэнос-Айрес",
    description: "Танго, архитектура и гастрономия — старт маршрута",
    keywords: ["buenos aires", "buenos", "ба", "реколета", "san telmo", "la boca"],
  },
  {
    label: "Барилоче",
    type: "city",
    region: "Патагония",
    description: "Озёра, горнолыжные склоны и шоколадные мастерские",
    keywords: ["bariloche", "nahuel huapi", "catedral"],
  },
  {
    label: "Эль-Калафате",
    type: "city",
    region: "Патагония",
    description: "База у ледников и круизов по озёрам",
    keywords: ["calafate", "калафате", "los glaciares"],
  },
  {
    label: "Ушуайя",
    type: "city",
    region: "Огненная Земля",
    description: "Самый южный город мира и канал Бигля",
    keywords: ["ushuaia", "огненная", "beagle", "антарктида"],
  },
  {
    label: "Игуасу",
    type: "city",
    region: "Misiones",
    description: "Водопады, джунгли и пограничный регион с Бразилией",
    keywords: ["iguazu", "iguazú", "puerto iguazu", "водопад", "misiones"],
  },
  {
    label: "Сальта",
    type: "city",
    region: "Сальта",
    description: "Каньоны, виноградники Cafayate и колониальный центр",
    keywords: ["salta", "humahuaca", "cafayate", "каньон"],
  },
  {
    label: "Мендоса",
    type: "city",
    region: "Мендоса",
    description: "Винодельни и дегустации Malbec у подножия Аконкагуа",
    keywords: ["mendoza", "malbec", "вино", "aconcagua"],
  },
  {
    label: "Патагония",
    type: "region",
    region: "Патагония",
    description: "Ледники, горы Fitz Roy и бескрайние степи юга",
    keywords: ["patagonia", "патагон"],
  },
  {
    label: "Перито-Морено",
    type: "landmark",
    region: "Патагония",
    nearCity: "Эль-Калафате",
    description: "Главный ледник Los Glaciares — обвал льда с близких смотровых",
    keywords: ["perito moreno", "ледник", "glaciares"],
  },
  {
    label: "Лаго Аргентино",
    type: "landmark",
    region: "Патагония",
    nearCity: "Эль-Калафате",
    description: "Озеро с ледниковыми отколами и круизами к ледникам",
    keywords: ["lago argentino", "аргентино", "озеро"],
  },
  {
    label: "Fitz Roy",
    type: "landmark",
    region: "Патагония",
    nearCity: "Эль-Чалten",
    description: "Гранитная вершина и треккинги вокруг Chaltén",
    keywords: ["fitz roy", "chaltén", "el chalten", "chalten"],
  },
  {
    label: "Torres del Paine",
    type: "park",
    region: "Патагония",
    nearCity: "Пунта-Аренas",
    description: "Чилийский парк с башнями Torres — часто в комбинированных турах",
    keywords: ["torres del paine", "торрес", "paine"],
  },
  {
    label: "Национальный парк Иguacu",
    type: "park",
    region: "Misiones",
    nearCity: "Игуасу",
    description: "275 водопадов и тропы к Garganta del Diablo",
    keywords: ["iguacu", "iguazu", "игуасу", "unesco"],
  },
] as const;

export type SearchDestinationType = (typeof SEARCH_DESTINATIONS)[number]["type"];

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
