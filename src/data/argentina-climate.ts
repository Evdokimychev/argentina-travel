export type ArgentinaClimateRegion = {
  id: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  description: string;
};

export type ArgentinaClimateMonth = {
  month: number; // 1–12
  label: string;
  labelShort: string;
  highC: number;
  lowC: number;
  rainMm: number;
  rainDays: number;
  condition: string;
  emoji: string;
  /** 1 = low, 2 = good, 3 = best season for tourism */
  travelScore: 1 | 2 | 3;
};

export const ARGENTINA_CLIMATE_REGIONS: ArgentinaClimateRegion[] = [
  {
    id: "ba",
    name: "Буэнос-Айрес",
    shortName: "BA",
    latitude: -34.6037,
    longitude: -58.3816,
    timezone: "America/Argentina/Buenos_Aires",
    description: "Субтропический влажный климат: жаркое лето, мягкая зима.",
  },
  {
    id: "patagonia",
    name: "Патагония (El Calafate)",
    shortName: "Patagonia",
    latitude: -50.3375,
    longitude: -72.265,
    timezone: "America/Argentina/Rio_Gallegos",
    description: "Прохладно и ветрено; короткое лето, длинная зима.",
  },
  {
    id: "iguazu",
    name: "Iguazú и Misiones",
    shortName: "Iguazú",
    latitude: -25.6953,
    longitude: -54.4367,
    timezone: "America/Argentina/Cordoba",
    description: "Субтропики: тепло круглый год, высокая влажность и сезон дождей.",
  },
  {
    id: "salta",
    name: "Salta и северо-запад",
    shortName: "NOA",
    latitude: -24.7821,
    longitude: -65.4232,
    timezone: "America/Argentina/Salta",
    description: "Горный континентальный климат: жаркие дни, прохладные ночи.",
  },
  {
    id: "mendoza",
    name: "Mendoza",
    shortName: "Mendoza",
    latitude: -32.8895,
    longitude: -68.8458,
    timezone: "America/Argentina/Mendoza",
    description: "Сухой континентальный: жаркое лето, прохладные вечера, мало осадков.",
  },
];

/** Средние климатические нормы (ориентир для планирования, не прогноз). */
export const ARGENTINA_CLIMATE_MONTHLY: Record<string, ArgentinaClimateMonth[]> = {
  ba: [
    { month: 1, label: "Январь", labelShort: "Янв", highC: 30, lowC: 20, rainMm: 119, rainDays: 9, condition: "Жарко, влажно", emoji: "☀️", travelScore: 2 },
    { month: 2, label: "Февраль", labelShort: "Фев", highC: 29, lowC: 19, rainMm: 117, rainDays: 8, condition: "Жарко", emoji: "🌤️", travelScore: 2 },
    { month: 3, label: "Март", labelShort: "Мар", highC: 26, lowC: 17, rainMm: 134, rainDays: 9, condition: "Комфортно", emoji: "🌸", travelScore: 3 },
    { month: 4, label: "Апрель", labelShort: "Апр", highC: 22, lowC: 14, rainMm: 97, rainDays: 7, condition: "Осенняя прохлада", emoji: "🍂", travelScore: 3 },
    { month: 5, label: "Май", labelShort: "Май", highC: 18, lowC: 11, rainMm: 74, rainDays: 6, condition: "Мягко", emoji: "🌿", travelScore: 3 },
    { month: 6, label: "Июнь", labelShort: "Июн", highC: 15, lowC: 8, rainMm: 63, rainDays: 5, condition: "Зима, сырость", emoji: "🌥️", travelScore: 2 },
    { month: 7, label: "Июль", labelShort: "Июл", highC: 15, lowC: 7, rainMm: 58, rainDays: 5, condition: "Зима", emoji: "🧥", travelScore: 2 },
    { month: 8, label: "Август", labelShort: "Авг", highC: 17, lowC: 8, rainMm: 58, rainDays: 5, condition: "Прохладно", emoji: "🌬️", travelScore: 2 },
    { month: 9, label: "Сентябрь", labelShort: "Сен", highC: 19, lowC: 10, rainMm: 69, rainDays: 6, condition: "Весна", emoji: "🌱", travelScore: 3 },
    { month: 10, label: "Октябрь", labelShort: "Окт", highC: 22, lowC: 13, rainMm: 108, rainDays: 8, condition: "Комфортно", emoji: "🌤️", travelScore: 3 },
    { month: 11, label: "Ноябрь", labelShort: "Ноя", highC: 25, lowC: 15, rainMm: 108, rainDays: 8, condition: "Тепло", emoji: "🌺", travelScore: 3 },
    { month: 12, label: "Декабрь", labelShort: "Дек", highC: 28, lowC: 18, rainMm: 105, rainDays: 8, condition: "Высокий сезон", emoji: "☀️", travelScore: 2 },
  ],
  patagonia: [
    { month: 1, label: "Январь", labelShort: "Янв", highC: 18, lowC: 7, rainMm: 38, rainDays: 6, condition: "Лето, ветер", emoji: "💨", travelScore: 3 },
    { month: 2, label: "Февраль", labelShort: "Фев", highC: 17, lowC: 7, rainMm: 28, rainDays: 5, condition: "Пик сезона", emoji: "🏔️", travelScore: 3 },
    { month: 3, label: "Март", labelShort: "Мар", highC: 15, lowC: 5, rainMm: 32, rainDays: 6, condition: "Ещё тепло", emoji: "🌤️", travelScore: 3 },
    { month: 4, label: "Апрель", labelShort: "Апр", highC: 12, lowC: 2, rainMm: 28, rainDays: 6, condition: "Прохладно", emoji: "🌥️", travelScore: 2 },
    { month: 5, label: "Май", labelShort: "Май", highC: 8, lowC: -1, rainMm: 22, rainDays: 5, condition: "Поздняя осень", emoji: "❄️", travelScore: 1 },
    { month: 6, label: "Июнь", labelShort: "Июн", highC: 5, lowC: -2, rainMm: 18, rainDays: 4, condition: "Зима", emoji: "🌨️", travelScore: 1 },
    { month: 7, label: "Июль", labelShort: "Июл", highC: 5, lowC: -3, rainMm: 15, rainDays: 4, condition: "Лыжи Bariloche", emoji: "⛷️", travelScore: 2 },
    { month: 8, label: "Август", labelShort: "Авг", highC: 7, lowC: -2, rainMm: 16, rainDays: 4, condition: "Холодно", emoji: "🧊", travelScore: 1 },
    { month: 9, label: "Сентябрь", labelShort: "Сен", highC: 10, lowC: 0, rainMm: 18, rainDays: 5, condition: "Ранняя весна", emoji: "🌱", travelScore: 2 },
    { month: 10, label: "Октябрь", labelShort: "Окт", highC: 13, lowC: 2, rainMm: 22, rainDays: 5, condition: "Открываются тропы", emoji: "🥾", travelScore: 2 },
    { month: 11, label: "Ноябрь", labelShort: "Ноя", highC: 16, lowC: 4, rainMm: 28, rainDays: 5, condition: "Старт сезона", emoji: "🌸", travelScore: 3 },
    { month: 12, label: "Декабрь", labelShort: "Дек", highC: 17, lowC: 6, rainMm: 32, rainDays: 6, condition: "Сезон начинается", emoji: "☀️", travelScore: 3 },
  ],
  iguazu: [
    { month: 1, label: "Январь", labelShort: "Янв", highC: 32, lowC: 21, rainMm: 198, rainDays: 12, condition: "Жарко, дождливо", emoji: "🌧️", travelScore: 1 },
    { month: 2, label: "Февраль", labelShort: "Фев", highC: 31, lowC: 21, rainMm: 173, rainDays: 11, condition: "Макс. воды", emoji: "💦", travelScore: 2 },
    { month: 3, label: "Март", labelShort: "Мар", highC: 29, lowC: 19, rainMm: 143, rainDays: 10, condition: "Баланс", emoji: "🌤️", travelScore: 3 },
    { month: 4, label: "Апрель", labelShort: "Апр", highC: 26, lowC: 16, rainMm: 133, rainDays: 9, condition: "Комфортно", emoji: "🍃", travelScore: 3 },
    { month: 5, label: "Май", labelShort: "Май", highC: 23, lowC: 13, rainMm: 132, rainDays: 8, condition: "Меньше дождей", emoji: "🌿", travelScore: 3 },
    { month: 6, label: "Июнь", labelShort: "Июн", highC: 21, lowC: 11, rainMm: 133, rainDays: 8, condition: "Сухее", emoji: "🌥️", travelScore: 2 },
    { month: 7, label: "Июль", labelShort: "Июл", highC: 22, lowC: 11, rainMm: 95, rainDays: 7, condition: "Прохладнее", emoji: "💧", travelScore: 2 },
    { month: 8, label: "Август", labelShort: "Авг", highC: 24, lowC: 12, rainMm: 81, rainDays: 7, condition: "Тепло", emoji: "🌤️", travelScore: 2 },
    { month: 9, label: "Сентябрь", labelShort: "Сен", highC: 26, lowC: 14, rainMm: 138, rainDays: 9, condition: "Весна", emoji: "🌸", travelScore: 3 },
    { month: 10, label: "Октябрь", labelShort: "Окт", highC: 28, lowC: 16, rainMm: 173, rainDays: 10, condition: "Комфортно", emoji: "🌺", travelScore: 3 },
    { month: 11, label: "Ноябрь", labelShort: "Ноя", highC: 30, lowC: 18, rainMm: 162, rainDays: 10, condition: "Жарко", emoji: "☀️", travelScore: 2 },
    { month: 12, label: "Декабрь", labelShort: "Дек", highC: 31, lowC: 20, rainMm: 175, rainDays: 11, condition: "Сезон дождей", emoji: "🌧️", travelScore: 1 },
  ],
  salta: [
    { month: 1, label: "Январь", labelShort: "Янв", highC: 28, lowC: 16, rainMm: 182, rainDays: 14, condition: "Жарко, грозы", emoji: "⛈️", travelScore: 1 },
    { month: 2, label: "Февраль", labelShort: "Фев", highC: 27, lowC: 15, rainMm: 155, rainDays: 12, condition: "Дождливо", emoji: "🌧️", travelScore: 2 },
    { month: 3, label: "Март", labelShort: "Мар", highC: 25, lowC: 14, rainMm: 120, rainDays: 10, condition: "Комфортно", emoji: "🌸", travelScore: 3 },
    { month: 4, label: "Апрель", labelShort: "Апр", highC: 23, lowC: 11, rainMm: 38, rainDays: 4, condition: "Сухо", emoji: "🌤️", travelScore: 3 },
    { month: 5, label: "Май", labelShort: "Май", highC: 21, lowC: 7, rainMm: 8, rainDays: 2, condition: "Идеально", emoji: "🏜️", travelScore: 3 },
    { month: 6, label: "Июнь", labelShort: "Июн", highC: 19, lowC: 4, rainMm: 4, rainDays: 1, condition: "Сухая зима", emoji: "🧥", travelScore: 3 },
    { month: 7, label: "Июль", labelShort: "Июл", highC: 20, lowC: 3, rainMm: 3, rainDays: 1, condition: "Прохладные ночи", emoji: "🌙", travelScore: 3 },
    { month: 8, label: "Август", labelShort: "Авг", highC: 22, lowC: 5, rainMm: 5, rainDays: 1, condition: "Тепло днём", emoji: "☀️", travelScore: 3 },
    { month: 9, label: "Сентябрь", labelShort: "Сен", highC: 25, lowC: 9, rainMm: 12, rainDays: 2, condition: "Весна", emoji: "🌱", travelScore: 3 },
    { month: 10, label: "Октябрь", labelShort: "Окт", highC: 27, lowC: 12, rainMm: 38, rainDays: 5, condition: "Комфортно", emoji: "🍂", travelScore: 3 },
    { month: 11, label: "Ноябрь", labelShort: "Ноя", highC: 28, lowC: 14, rainMm: 72, rainDays: 8, condition: "Жарко", emoji: "🌤️", travelScore: 2 },
    { month: 12, label: "Декабрь", labelShort: "Дек", highC: 28, lowC: 15, rainMm: 130, rainDays: 11, condition: "Дождливо", emoji: "🌧️", travelScore: 1 },
  ],
  mendoza: [
    { month: 1, label: "Январь", labelShort: "Янв", highC: 33, lowC: 18, rainMm: 35, rainDays: 4, condition: "Жарко, сухо", emoji: "☀️", travelScore: 2 },
    { month: 2, label: "Февраль", labelShort: "Фев", highC: 31, lowC: 17, rainMm: 28, rainDays: 3, condition: "Жарко", emoji: "🌤️", travelScore: 2 },
    { month: 3, label: "Март", labelShort: "Мар", highC: 27, lowC: 14, rainMm: 25, rainDays: 3, condition: "Винный сезон", emoji: "🍇", travelScore: 3 },
    { month: 4, label: "Апрель", labelShort: "Апр", highC: 22, lowC: 9, rainMm: 12, rainDays: 2, condition: "Сбор урожая", emoji: "🍷", travelScore: 3 },
    { month: 5, label: "Май", labelShort: "Май", highC: 17, lowC: 5, rainMm: 8, rainDays: 2, condition: "Осень", emoji: "🍂", travelScore: 3 },
    { month: 6, label: "Июнь", labelShort: "Июн", highC: 14, lowC: 2, rainMm: 6, rainDays: 2, condition: "Зима", emoji: "🧥", travelScore: 2 },
    { month: 7, label: "Июль", labelShort: "Июл", highC: 14, lowC: 1, rainMm: 5, rainDays: 2, condition: "Прохладно", emoji: "❄️", travelScore: 2 },
    { month: 8, label: "Август", labelShort: "Авг", highC: 17, lowC: 3, rainMm: 6, rainDays: 2, condition: "Весна", emoji: "🌱", travelScore: 2 },
    { month: 9, label: "Сентябрь", labelShort: "Сен", highC: 21, lowC: 6, rainMm: 10, rainDays: 3, condition: "Комфортно", emoji: "🌸", travelScore: 3 },
    { month: 10, label: "Октябрь", labelShort: "Окт", highC: 25, lowC: 10, rainMm: 15, rainDays: 3, condition: "Тепло", emoji: "🌤️", travelScore: 3 },
    { month: 11, label: "Ноябрь", labelShort: "Ноя", highC: 29, lowC: 13, rainMm: 18, rainDays: 3, condition: "Жарко", emoji: "☀️", travelScore: 2 },
    { month: 12, label: "Декабрь", labelShort: "Дек", highC: 32, lowC: 16, rainMm: 22, rainDays: 3, condition: "Высокий сезон", emoji: "🌞", travelScore: 2 },
  ],
};

export function getClimateRegion(id: string): ArgentinaClimateRegion {
  const region = ARGENTINA_CLIMATE_REGIONS.find((r) => r.id === id);
  if (!region) return ARGENTINA_CLIMATE_REGIONS[0];
  return region;
}

export function getClimateMonths(regionId: string): ArgentinaClimateMonth[] {
  return ARGENTINA_CLIMATE_MONTHLY[regionId] ?? ARGENTINA_CLIMATE_MONTHLY.ba;
}
