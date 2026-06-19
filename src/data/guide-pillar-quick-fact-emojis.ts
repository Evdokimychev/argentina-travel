const DEFAULT_EMOJI = "📌";

/** Default emoji per guide topic slug when label has no specific mapping. */
const SLUG_DEFAULT_EMOJIS: Record<string, string> = {
  "kak-dobratsya": "✈️",
  "gde-zhit": "🏨",
  transport: "🚌",
  "turistskie-regiony": "🗺️",
  dostoprimechatelnosti: "🏔️",
  "pogoda-i-sezonnost": "🌤️",
  yazyk: "🗣️",
  kultura: "💃",
  istoriya: "📜",
  kukhnya: "🥩",
  svyaz: "📱",
  "ekonomika-i-dengi": "💵",
  shopping: "🛍️",
  bezopasnost: "🛡️",
};

/** Per-slug + label overrides for quick facts display. */
const SLUG_LABEL_EMOJIS: Record<string, Record<string, string>> = {
  "kak-dobratsya": {
    "Главный международный аэропорт": "🛬",
    "Внутренний хаб": "✈️",
    "Типичный перелёт из Европы": "🌍",
    "Внутренние авиалинии": "🛫",
    "Трансфер EZE → центр": "🚕",
    "Виза для РФ (туризм)": "🛂",
  },
  "gde-zhit": {
    "Районы BA": "🏙️",
    Патагония: "🏔️",
    "Короткий trip": "🧳",
    "Долгое проживание": "📅",
    Оплата: "💳",
    "Check-in": "🔑",
  },
  transport: {
    "BA → El Calafate": "🗺️",
    Лоукостеры: "✈️",
    "Ночной автобус": "🌙",
    "Метро BA": "🚇",
    "Аренда авто": "🚗",
    Приложения: "📲",
  },
  "turistskie-regiony": {
    "Регионов в каталоге": "📍",
    "Патагония — сезон": "❄️",
    "Iguazú из BA": "💧",
    Mendoza: "🍷",
    NOA: "🏜️",
    "Классика первой поездки": "⭐",
  },
  dostoprimechatelnosti: {
    "Перито-Морено": "🧊",
    Iguazú: "🌊",
    "Fitz Roy": "⛰️",
    "BA must-see": "🏛️",
    Пингвины: "🐧",
    Экскурсии: "🎟️",
  },
  "pogoda-i-sezonnost": {
    "Патагония — лучший сезон": "☀️",
    "BA — комфорт": "🌡️",
    "Iguazú — меньше дождей": "🌧️",
    "Salta / NOA": "🏔️",
    "Высокий сезон": "📆",
    "Ветер Patagonia": "💨",
  },
  yazyk: {
    Язык: "🇦🇷",
    Особенность: "💬",
    Английский: "🇬🇧",
    "Must-know": "✅",
    "Русский гид": "👤",
    "Курсы в BA": "📚",
  },
  kultura: {
    Ужин: "🍽️",
    Mate: "🧉",
    Приветствие: "👋",
    Танго: "🎵",
    Asado: "🔥",
    Fútbol: "⚽",
  },
  istoriya: {
    Независимость: "🇦🇷",
    "Перón (Perón) / Evita": "✊",
    "Демократия с": "🗳️",
    "Must-see": "🏛️",
    Мемориал: "🕊️",
    Иммиграция: "🚢",
  },
  kukhnya: {
    "Must-try": "🍖",
    Вино: "🍷",
    Ужин: "🌙",
    Chimichurri: "🌿",
    Helado: "🍦",
    "Bodega tour": "🍇",
  },
  svyaz: {
    Операторы: "📶",
    eSIM: "📲",
    "4G в городах": "🏙️",
    "Patagonia тропы": "📴",
    Мессенджер: "💬",
    Пополнение: "💳",
  },
  "ekonomika-i-dengi": {
    "Официальный USD": "🏦",
    "Синий USD": "💱",
    Валюта: "💵",
    Инфляция: "📈",
    "Visa / Mastercard": "💳",
    "Лучший курс для туриста": "💰",
  },
  shopping: {
    "Must-buy": "🎁",
    Feria: "🛒",
    "Tax free": "🧾",
    "Кожа BA": "👜",
    Alpaca: "🦙",
    Mall: "🏬",
  },
  bezopasnost: {
    "Главный риск BA": "⚠️",
    Безопаснее: "✅",
    Такси: "🚖",
    Экстренно: "🆘",
    Деньги: "💵",
    Patagonia: "🏔️",
  },
};

/** Shared label overrides when slug-specific mapping is absent. */
const GLOBAL_LABEL_EMOJIS: Record<string, string> = {
  Валюта: "💵",
  eSIM: "📲",
  Страховка: "🏥",
  Mendoza: "🍷",
  Iguazú: "💧",
};

export function getGuideQuickFactEmoji(
  slug: string,
  label: string,
  explicitEmoji?: string
): string {
  if (explicitEmoji) return explicitEmoji;
  const slugLabel = SLUG_LABEL_EMOJIS[slug]?.[label];
  if (slugLabel) return slugLabel;
  const globalLabel = GLOBAL_LABEL_EMOJIS[label];
  if (globalLabel) return globalLabel;
  return SLUG_DEFAULT_EMOJIS[slug] ?? DEFAULT_EMOJI;
}
