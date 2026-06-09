import {
  AccommodationType,
  ChildrenPolicy,
  ComfortLevel,
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

export const DURATION_OPTIONS: DurationBucket[] = [
  "1 день",
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

export const COMFORT_OPTIONS: { level: ComfortLevel; description: string }[] = [
  { level: "Базовый", description: "Палатки, кемпинги, минимальные удобства." },
  { level: "Стандарт", description: "Хостелы, бюджетные отели, удобства на этаже." },
  { level: "Комфорт", description: "Отели 3–4*, завтраки, уборка." },
  { level: "Премиум", description: "Boutique-отели, спа, индивидуальный сервис." },
  { level: "Люкс", description: "Лучшие отели, глэмпинг, VIP-трансферы." },
];

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
    description: "Танго, архитектура, гастрономия",
    image: "https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=600&q=80",
    keywords: ["буэнос", "ba"],
  },
  {
    id: "bariloche",
    name: "Барилоче",
    region: "Патагония",
    description: "Озёра, горы, шоколад",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    keywords: ["барилоче", "bariloche"],
  },
  {
    id: "calafate",
    name: "Эль-Калафате",
    region: "Патагония",
    description: "Ледник Перито-Морено",
    image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=600&q=80",
    keywords: ["калафате", "calafate", "перито"],
  },
  {
    id: "ushuaia",
    name: "Ушуайя",
    region: "Огненная Земля",
    description: "Край света",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
    keywords: ["ушуайя", "ushuaia"],
  },
  {
    id: "iguazu",
    name: "Игуасу",
    region: "Misiones",
    description: "280 водопадов",
    image: "https://images.unsplash.com/photo-1558980664-1db756751b1a?w=600&q=80",
    keywords: ["игуасу", "iguazu"],
  },
  {
    id: "mendoza",
    name: "Мендоса",
    region: "Анд",
    description: "Винодельни и горы",
    image: "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=600&q=80",
    keywords: ["мендоса", "mendoza"],
  },
  {
    id: "salta",
    name: "Сальта",
    region: "Северо-Запад",
    description: "Каньоны и вина",
    image: "https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=600&q=80",
    keywords: ["сальта", "salta"],
  },
  {
    id: "patagonia",
    name: "Патагония",
    region: "Юг",
    description: "Ледники и треккинг",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    keywords: ["патагония", "patagonia"],
  },
];
