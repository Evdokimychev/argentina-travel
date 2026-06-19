import type { TripPrepCategory, TripPrepItemView, TripPrepTourType } from "@/types/trip-prep";

export const DEFAULT_TRIP_PREP_TEMPLATE_ID = "local-default-trip-prep";
export const DEFAULT_TRIP_PREP_TEMPLATE_NAME = "Стандартная поездка в Аргентину";

type DefaultItemSeed = {
  id: string;
  category: TripPrepCategory;
  title: string;
  description?: string;
  sortOrder: number;
  required: boolean;
};

/** Offline fallback when Supabase API недоступен — зеркало seed-миграции. */
export const DEFAULT_TRIP_PREP_ITEMS: DefaultItemSeed[] = [
  {
    id: "local-prep-01",
    category: "documents",
    title: "Проверить срок действия загранпаспорта",
    description:
      "Убедитесь, что документ действителен минимум 6 месяцев после даты возвращения. Правила могут меняться — уточняйте перед поездкой.",
    sortOrder: 10,
    required: true,
  },
  {
    id: "local-prep-02",
    category: "documents",
    title: "Сохранить подтверждение бронирования",
    description:
      "Распечатайте или сохраните офлайн письмо с деталями заявки и контактами организатора.",
    sortOrder: 20,
    required: false,
  },
  {
    id: "local-prep-03",
    category: "connectivity",
    title: "Подготовить связь в поездке",
    description:
      "Купите eSIM или местную SIM-карту заранее либо уточните у оператора условия роуминга.",
    sortOrder: 30,
    required: false,
  },
  {
    id: "local-prep-04",
    category: "connectivity",
    title: "Скачать офлайн-карты",
    description:
      "Сохраните карты Буэнос-Айреса и региона тура в Google Maps или аналоге — связь в пути не всегда стабильна.",
    sortOrder: 40,
    required: false,
  },
  {
    id: "local-prep-05",
    category: "money",
    title: "Уведомить банк о поездке",
    description:
      "Сообщите банку даты поездки, чтобы не заблокировали карту при оплатах в Аргентине.",
    sortOrder: 50,
    required: true,
  },
  {
    id: "local-prep-06",
    category: "money",
    title: "Подготовить наличные песо",
    description:
      "Имейте небольшую сумму на первые дни: такси, чаевые, мелкие покупки. Курс и способы обмена уточняйте перед поездкой.",
    sortOrder: 60,
    required: false,
  },
  {
    id: "local-prep-07",
    category: "health",
    title: "Оформить медицинскую страховку",
    description: "Полис должен покрывать поездку за границу и активности по программе тура.",
    sortOrder: 70,
    required: true,
  },
  {
    id: "local-prep-08",
    category: "health",
    title: "Собрать базовую аптечку",
    description:
      "Возьмите лекарства по назначению, средства от солнца и насекомых — особенно для южных регионов.",
    sortOrder: 80,
    required: false,
  },
  {
    id: "local-prep-09",
    category: "luggage",
    title: "Проверить нормы багажа",
    description:
      "Сверьте вес и габариты с правилами авиакомпании; учтите перелёты внутри страны, если они есть в программе.",
    sortOrder: 90,
    required: false,
  },
  {
    id: "local-prep-10",
    category: "luggage",
    title: "Подобрать одежду по сезону и региону",
    description:
      "Патагония, Анд и Буэнос-Айрес требуют разного гардероба — проверьте прогноз и рекомендации организатора.",
    sortOrder: 100,
    required: false,
  },
  {
    id: "local-prep-11",
    category: "transfer",
    title: "Уточнить место и время встречи",
    description:
      "Запишите адрес, время и способ добраться до точки старта — особенно если прилёт ночью.",
    sortOrder: 110,
    required: true,
  },
  {
    id: "local-prep-12",
    category: "organizer",
    title: "Сохранить контакты организатора",
    description:
      "Добавьте телефон и WhatsApp организатора в телефонную книгу и продублируйте в мессенджере.",
    sortOrder: 120,
    required: true,
  },
];

export function defaultTripPrepItemsAsViews(checkedIds: Set<string>): TripPrepItemView[] {
  return DEFAULT_TRIP_PREP_ITEMS.map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    description: item.description ?? null,
    sortOrder: item.sortOrder,
    required: item.required,
    checked: checkedIds.has(item.id),
    checkedAt: checkedIds.has(item.id) ? new Date().toISOString() : null,
  }));
}

export function resolveLocalTripPrepTourType(input: {
  bookingSource?: string;
  guests?: number;
}): TripPrepTourType {
  if (input.bookingSource && input.bookingSource !== "platform") return "partner";
  if (input.guests === 1) return "individual";
  return "group";
}
