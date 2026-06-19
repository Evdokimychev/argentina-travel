/**
 * Показатели силы паспортов.
 * Обновляйте ежегодно по Henley Passport Index / Arton Passport Index.
 */
export const PASSPORT_POWER_EDITION = {
  year: 2025,
  label: "Henley & Partners, январь 2025",
  updatedAt: "2025-01",
} as const;

export type PassportAccessType = "visaFree" | "visaOnArrival" | "eVisa" | "visaRequired";

export type PassportAccessBreakdown = Record<PassportAccessType, number>;

export type VisaFreeRegion = "all" | "europe" | "americas" | "asia" | "africa" | "oceania";

export type VisaFreeHighlight = {
  label: string;
  region: Exclude<VisaFreeRegion, "all">;
};

export type PassportCoverTheme = {
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  republicLine: string;
  accentGlow: string;
};

export type PassportProfile = {
  code: string;
  country: string;
  flag: string;
  globalRank: number;
  totalRanked: number;
  destinations: number;
  worldAccessPercent: number;
  access: PassportAccessBreakdown;
  visaFreeHighlights: VisaFreeHighlight[];
  cover: PassportCoverTheme;
  /** Основной паспорт страницы (Аргентина) */
  isPrimary?: boolean;
};

export type PassportBenchmark = {
  code: string;
  country: string;
  rank: number;
  destinations: number;
  flag: string;
  highlight?: boolean;
};

export const PRIMARY_PASSPORT_CODE = "AR";

export const VISA_FREE_REGION_LABELS: Record<VisaFreeRegion, string> = {
  all: "Все",
  europe: "Европа",
  americas: "Америка",
  asia: "Азия",
  africa: "Африка",
  oceania: "Океания",
};

const AR_VISA_FREE: VisaFreeHighlight[] = [
  { label: "Шенген (27 стран)", region: "europe" },
  { label: "Германия", region: "europe" },
  { label: "Франция", region: "europe" },
  { label: "Италия", region: "europe" },
  { label: "Испания", region: "europe" },
  { label: "Великобритания", region: "europe" },
  { label: "Ирландия", region: "europe" },
  { label: "Швейцария", region: "europe" },
  { label: "Норвегия", region: "europe" },
  { label: "Греция", region: "europe" },
  { label: "Португалия", region: "europe" },
  { label: "Польша", region: "europe" },
  { label: "Чехия", region: "europe" },
  { label: "Хорватия", region: "europe" },
  { label: "Япония", region: "asia" },
  { label: "Южная Корея", region: "asia" },
  { label: "Сингапур", region: "asia" },
  { label: "Гонконг", region: "asia" },
  { label: "Малайзия", region: "asia" },
  { label: "Таиланд", region: "asia" },
  { label: "Индонезия", region: "asia" },
  { label: "ОАЭ", region: "asia" },
  { label: "Израиль", region: "asia" },
  { label: "Турция", region: "asia" },
  { label: "Бразилия", region: "americas" },
  { label: "Чили", region: "americas" },
  { label: "Уругвай", region: "americas" },
  { label: "Парагвай", region: "americas" },
  { label: "Боливия", region: "americas" },
  { label: "Перу", region: "americas" },
  { label: "Колумбия", region: "americas" },
  { label: "Эквадор", region: "americas" },
  { label: "Мексика", region: "americas" },
  { label: "Коста-Рика", region: "americas" },
  { label: "Панама", region: "americas" },
  { label: "ЮАР", region: "africa" },
  { label: "Марокко", region: "africa" },
  { label: "Тунис", region: "africa" },
  { label: "Новая Зеландия", region: "oceania" },
  { label: "Фиджи", region: "oceania" },
];

export const PASSPORT_PROFILES: Record<string, PassportProfile> = {
  AR: {
    code: "AR",
    country: "Аргентина",
    flag: "🇦🇷",
    globalRank: 19,
    totalRanked: 199,
    destinations: 171,
    worldAccessPercent: 88,
    access: { visaFree: 120, visaOnArrival: 35, eVisa: 16, visaRequired: 24 },
    visaFreeHighlights: AR_VISA_FREE,
    cover: {
      gradientFrom: "#5a9fd4",
      gradientVia: "#74acdf",
      gradientTo: "#8ec5ef",
      republicLine: "República Argentina",
      accentGlow: "rgba(116,172,223,0.45)",
    },
    isPrimary: true,
  },
  CL: {
    code: "CL",
    country: "Чили",
    flag: "🇨🇱",
    globalRank: 15,
    totalRanked: 199,
    destinations: 175,
    worldAccessPercent: 90,
    access: { visaFree: 124, visaOnArrival: 34, eVisa: 17, visaRequired: 20 },
    visaFreeHighlights: [
      { label: "Шенген (27 стран)", region: "europe" },
      { label: "Великобритания", region: "europe" },
      { label: "Япония", region: "asia" },
      { label: "Южная Корея", region: "asia" },
      { label: "Сингапур", region: "asia" },
      { label: "США", region: "americas" },
      { label: "Канада", region: "americas" },
      { label: "Мексика", region: "americas" },
      { label: "Бразилия", region: "americas" },
      { label: "Аргентина", region: "americas" },
      { label: "Уругвай", region: "americas" },
      { label: "ОАЭ", region: "asia" },
      { label: "Израиль", region: "asia" },
      { label: "Новая Зеландия", region: "oceania" },
    ],
    cover: {
      gradientFrom: "#c0392b",
      gradientVia: "#e74c3c",
      gradientTo: "#1a5276",
      republicLine: "República de Chile",
      accentGlow: "rgba(231,76,60,0.35)",
    },
  },
  BR: {
    code: "BR",
    country: "Бразилия",
    flag: "🇧🇷",
    globalRank: 19,
    totalRanked: 199,
    destinations: 171,
    worldAccessPercent: 88,
    access: { visaFree: 119, visaOnArrival: 36, eVisa: 16, visaRequired: 24 },
    visaFreeHighlights: [
      { label: "Шенген (27 стран)", region: "europe" },
      { label: "Великобритания", region: "europe" },
      { label: "Япония", region: "asia" },
      { label: "Южная Корея", region: "asia" },
      { label: "Аргентина", region: "americas" },
      { label: "Чили", region: "americas" },
      { label: "Уругвай", region: "americas" },
      { label: "Парагвай", region: "americas" },
      { label: "Россия", region: "europe" },
      { label: "ЮАР", region: "africa" },
      { label: "ОАЭ", region: "asia" },
    ],
    cover: {
      gradientFrom: "#1e8449",
      gradientVia: "#27ae60",
      gradientTo: "#f1c40f",
      republicLine: "República Federativa do Brasil",
      accentGlow: "rgba(39,174,96,0.35)",
    },
  },
  UY: {
    code: "UY",
    country: "Уругвай",
    flag: "🇺🇾",
    globalRank: 28,
    totalRanked: 199,
    destinations: 154,
    worldAccessPercent: 79,
    access: { visaFree: 108, visaOnArrival: 30, eVisa: 16, visaRequired: 41 },
    visaFreeHighlights: [
      { label: "Шенген (27 стран)", region: "europe" },
      { label: "Аргентина", region: "americas" },
      { label: "Бразилия", region: "americas" },
      { label: "Чили", region: "americas" },
      { label: "Парагвай", region: "americas" },
      { label: "Панама", region: "americas" },
      { label: "Израиль", region: "asia" },
      { label: "ОАЭ", region: "asia" },
    ],
    cover: {
      gradientFrom: "#2471a3",
      gradientVia: "#3498db",
      gradientTo: "#ffffff",
      republicLine: "República Oriental del Uruguay",
      accentGlow: "rgba(52,152,219,0.35)",
    },
  },
  MX: {
    code: "MX",
    country: "Мексика",
    flag: "🇲🇽",
    globalRank: 22,
    totalRanked: 199,
    destinations: 159,
    worldAccessPercent: 82,
    access: { visaFree: 112, visaOnArrival: 32, eVisa: 15, visaRequired: 36 },
    visaFreeHighlights: [
      { label: "Шенген (27 стран)", region: "europe" },
      { label: "Япония", region: "asia" },
      { label: "Южная Корея", region: "asia" },
      { label: "Сингапур", region: "asia" },
      { label: "США", region: "americas" },
      { label: "Канада", region: "americas" },
      { label: "Бразилия", region: "americas" },
      { label: "Аргентина", region: "americas" },
      { label: "Колумбия", region: "americas" },
    ],
    cover: {
      gradientFrom: "#1a5276",
      gradientVia: "#2874a6",
      gradientTo: "#c0392b",
      republicLine: "Estados Unidos Mexicanos",
      accentGlow: "rgba(40,116,166,0.35)",
    },
  },
  RU: {
    code: "RU",
    country: "Россия",
    flag: "🇷🇺",
    globalRank: 53,
    totalRanked: 199,
    destinations: 114,
    worldAccessPercent: 58,
    access: { visaFree: 78, visaOnArrival: 24, eVisa: 12, visaRequired: 81 },
    visaFreeHighlights: [
      { label: "Армения", region: "asia" },
      { label: "Беларусь", region: "europe" },
      { label: "Казахстан", region: "asia" },
      { label: "Киргизия", region: "asia" },
      { label: "Сербия", region: "europe" },
      { label: "Турция", region: "asia" },
      { label: "ОАЭ", region: "asia" },
      { label: "Таиланд", region: "asia" },
      { label: "Куба", region: "americas" },
      { label: "Грузия", region: "asia" },
      { label: "Азербайджан", region: "asia" },
    ],
    cover: {
      gradientFrom: "#1a237e",
      gradientVia: "#283593",
      gradientTo: "#b71c1c",
      republicLine: "Российская Федерация",
      accentGlow: "rgba(40,53,147,0.35)",
    },
  },
  FR: {
    code: "FR",
    country: "Франция",
    flag: "🇫🇷",
    globalRank: 3,
    totalRanked: 199,
    destinations: 192,
    worldAccessPercent: 98,
    access: { visaFree: 142, visaOnArrival: 38, eVisa: 12, visaRequired: 3 },
    visaFreeHighlights: [
      { label: "Шенген (27 стран)", region: "europe" },
      { label: "Великобритания", region: "europe" },
      { label: "США", region: "americas" },
      { label: "Канада", region: "americas" },
      { label: "Япония", region: "asia" },
      { label: "Австралия", region: "oceania" },
      { label: "Бразилия", region: "americas" },
      { label: "Аргентина", region: "americas" },
      { label: "ОАЭ", region: "asia" },
      { label: "Сингапур", region: "asia" },
    ],
    cover: {
      gradientFrom: "#1a237e",
      gradientVia: "#3949ab",
      gradientTo: "#b71c1c",
      republicLine: "République française",
      accentGlow: "rgba(57,73,171,0.35)",
    },
  },
  SG: {
    code: "SG",
    country: "Сингапур",
    flag: "🇸🇬",
    globalRank: 1,
    totalRanked: 199,
    destinations: 195,
    worldAccessPercent: 100,
    access: { visaFree: 148, visaOnArrival: 35, eVisa: 12, visaRequired: 0 },
    visaFreeHighlights: [
      { label: "Шенген (27 стран)", region: "europe" },
      { label: "США", region: "americas" },
      { label: "Канада", region: "americas" },
      { label: "Япония", region: "asia" },
      { label: "Австралия", region: "oceania" },
      { label: "Новая Зеландия", region: "oceania" },
      { label: "Бразилия", region: "americas" },
      { label: "Аргентина", region: "americas" },
      { label: "ОАЭ", region: "asia" },
      { label: "Южная Корея", region: "asia" },
    ],
    cover: {
      gradientFrom: "#b71c1c",
      gradientVia: "#ffffff",
      gradientTo: "#1a237e",
      republicLine: "Republic of Singapore",
      accentGlow: "rgba(183,28,28,0.25)",
    },
  },
};

/** Паспорта в переключателе виджета */
export const PASSPORT_PICKER_ORDER = ["AR", "CL", "BR", "UY", "MX", "RU", "FR", "SG"] as const;

export type PassportPickerCode = (typeof PASSPORT_PICKER_ORDER)[number];

export function getPassportProfile(code: string): PassportProfile {
  return PASSPORT_PROFILES[code] ?? PASSPORT_PROFILES.AR;
}

/** @deprecated используйте PASSPORT_PROFILES.AR */
export const ARGENTINA_PASSPORT_STATS = PASSPORT_PROFILES.AR;

/** Верх рейтинга + окрестность позиции Аргентины */
export const GLOBAL_RANK_LADDER: PassportBenchmark[] = [
  { code: "SG", country: "Сингапур", rank: 1, destinations: 195, flag: "🇸🇬" },
  { code: "JP", country: "Япония", rank: 2, destinations: 193, flag: "🇯🇵" },
  { code: "FR", country: "Франция", rank: 3, destinations: 192, flag: "🇫🇷" },
  { code: "DE", country: "Германия", rank: 3, destinations: 192, flag: "🇩🇪" },
  { code: "CL", country: "Чили", rank: 15, destinations: 175, flag: "🇨🇱" },
  { code: "BR", country: "Бразилия", rank: 19, destinations: 171, flag: "🇧🇷" },
  { code: "AR", country: "Аргентина", rank: 19, destinations: 171, flag: "🇦🇷", highlight: true },
  { code: "MX", country: "Мексика", rank: 22, destinations: 159, flag: "🇲🇽" },
  { code: "RU", country: "Россия", rank: 53, destinations: 114, flag: "🇷🇺" },
];

export const LATAM_COMPARISON: PassportBenchmark[] = [
  { code: "CL", country: "Чили", rank: 15, destinations: 175, flag: "🇨🇱" },
  { code: "BR", country: "Бразилия", rank: 19, destinations: 171, flag: "🇧🇷" },
  { code: "AR", country: "Аргентина", rank: 19, destinations: 171, flag: "🇦🇷", highlight: true },
  { code: "UY", country: "Уругвай", rank: 28, destinations: 154, flag: "🇺🇾" },
  { code: "CO", country: "Колумбия", rank: 40, destinations: 133, flag: "🇨🇴" },
  { code: "PE", country: "Перу", rank: 42, destinations: 131, flag: "🇵🇪" },
];

export const PEERS_COMPARISON: PassportBenchmark[] = [
  { code: "FR", country: "Франция (ЕС)", rank: 3, destinations: 192, flag: "🇫🇷" },
  { code: "CL", country: "Чили", rank: 15, destinations: 175, flag: "🇨🇱" },
  { code: "AR", country: "Аргентина", rank: 19, destinations: 171, flag: "🇦🇷", highlight: true },
  { code: "RU", country: "Россия", rank: 53, destinations: 114, flag: "🇷🇺" },
];

export const ACCESS_TYPE_LABELS: Record<
  PassportAccessType,
  { label: string; description: string; color: string }
> = {
  visaFree: {
    label: "Без визы",
    description: "Въезд по паспорту",
    color: "var(--color-sky)",
  },
  visaOnArrival: {
    label: "Виза по прилёте",
    description: "Оформление в аэропорту",
    color: "var(--color-sun)",
  },
  eVisa: {
    label: "Электронное разрешение",
    description: "e-Visa / ETA онлайн",
    color: "var(--color-patagonia-light)",
  },
  visaRequired: {
    label: "Виза заранее",
    description: "Консульство до поездки",
    color: "#94a3b8",
  },
};

export const PASSPORT_POWER_DISCLAIMER =
  "Данные носят справочный характер. Правила въезда меняются — проверяйте требования страны назначения перед поездкой. Рейтинг обновляется ежегодно.";

export function buildComparisonLadder(
  items: PassportBenchmark[],
  selectedCode: string
): PassportBenchmark[] {
  return items.map((item) => ({
    ...item,
    highlight: item.code === selectedCode,
  }));
}
