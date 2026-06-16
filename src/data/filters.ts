import {
  AccommodationType,
  ChildrenPolicy,
  DifficultyLevel,
  DurationBucket,
  GroupSizeBucket,
  TourLanguage,
} from "@/types";

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

export const POPULAR_DESTINATIONS = [
  {
    id: "ba",
    name: "Буэнос-Айрес",
    region: "Столица",
    description: "Танго, архитектура и гастрономия — идеальный старт маршрута",
    image: "https://images.unsplash.com/photo-1583783878840-524663b10265?w=1200&q=80",
    keywords: ["буэнос", "ba", "buenos aires", "реколета", "san telmo"],
  },
  {
    id: "bariloche",
    name: "Барилоче",
    region: "Патагония",
    description: "Озёра Nahuel Huapi, Cerro Catedral и шоколадные fabrikas",
    image: "https://images.unsplash.com/photo-1610894793319-eb3844684c82?w=1200&q=80",
    keywords: ["барилоче", "bariloche", "nahuel huapi", "catedral"],
  },
  {
    id: "calafate",
    name: "Эль-Калафате",
    region: "Патагония",
    description: "Ледник Perito Moreno и ледниковые трекинги",
    image: "https://images.unsplash.com/photo-1615728512730-840a8da694f4?w=1200&q=80",
    keywords: ["калафате", "calafate", "перито", "perito moreno", "ледник"],
  },
  {
    id: "ushuaia",
    name: "Ушуайя",
    region: "Огненная Земля",
    description: "Самый южный город мира и ворота в Антарктиду",
    image: "https://images.unsplash.com/photo-1555109302-1f4c7032b3f0?w=1200&q=80",
    keywords: ["ушуайя", "ushuaia", "огненная", "beagle", "антарктида"],
  },
  {
    id: "iguazu",
    name: "Игуасу",
    region: "Misiones",
    description: "275 водопадов и Garganta del Diablo — UNESCO",
    image: "https://images.unsplash.com/photo-1520637836862-4cab0cba4342?w=1200&q=80",
    keywords: ["игуасу", "iguazu", "iguazú", "водопад", "misiones"],
  },
  {
    id: "mendoza",
    name: "Мендоса",
    region: "Анд",
    description: "Malbec, bodegas у подножия Aconcagua",
    image: "https://images.unsplash.com/photo-1560493676-04071c5e467d?w=1200&q=80",
    keywords: ["мендоса", "mendoza", "malbec", "вино", "aconcagua"],
  },
  {
    id: "salta",
    name: "Сальта",
    region: "Северо-Запад",
    description: "Quebrada de Humahuaca, Cafayate и колониальный центр",
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&q=80",
    keywords: ["сальта", "salta", "humahuaca", "cafayate", "каньон"],
  },
  {
    id: "patagonia",
    name: "Патагония",
    region: "Юг",
    description: "Ледники, Fitz Roy и бескрайние степи юга",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    keywords: ["патагония", "patagonia", "fitz roy", "chaltén", "valdés"],
  },
];
