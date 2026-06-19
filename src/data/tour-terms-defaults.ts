import type { TourFAQ } from "@/types";
import { normalizeEditorValue, trimHtmlToPlainTextLength } from "@/lib/rich-text";
import {
  ORGANIZER_TOUR_TERMS_ITEM_DETAIL_MAX,
  parseTourTermItem,
  serializeTourTermItem,
} from "@/lib/tour-terms-items";

export const ORGANIZER_TOUR_TERMS_ITEMS_MAX = 30;
export const ORGANIZER_TOUR_FAQ_MAX = 20;
export const ORGANIZER_TOUR_FAQ_QUESTION_MAX = 200;
export const ORGANIZER_TOUR_FAQ_ANSWER_MAX = 2000;
export const ORGANIZER_TOUR_TERMS_ITEM_MAX = 300;
export const ORGANIZER_TOUR_PACKING_LIST_MAX = 8000;
export const ORGANIZER_TOUR_INSURANCE_DESCRIPTION_MAX = 1000;
export const ORGANIZER_TOUR_CANCELLATION_TEXT_MAX = 2000;

export type OrganizerTourInsuranceType =
  | "not_required"
  | "recommended"
  | "required_not_included"
  | "included";

export const ORGANIZER_TOUR_INSURANCE_OPTIONS: {
  value: OrganizerTourInsuranceType;
  label: string;
}[] = [
  { value: "not_required", label: "Страховка не обязательна" },
  { value: "recommended", label: "Рекомендуем оформить страховку самостоятельно" },
  {
    value: "required_not_included",
    label: "Страховка обязательна и не включена в стоимость тура",
  },
  { value: "included", label: "Страховка включена в стоимость тура" },
];

export const DEFAULT_IGUAZU_INSURANCE_TYPE: OrganizerTourInsuranceType = "required_not_included";

export const DEFAULT_IGUAZU_INSURANCE_DESCRIPTION =
  "Оформите медицинскую страховку на весь период поездки до начала тура. Полис должен покрывать активный отдых и экстренную медицинскую помощь за рубежом.";

export type OrganizerTourFAQ = TourFAQ;

export function createFaqItemId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyFaqItem(): OrganizerTourFAQ {
  return { id: createFaqItemId(), question: "", answer: "" };
}

export function textToListItems(text: string): string[] {
  if (!text) return [];
  return text.split("\n").map((line) => line.replace(/^•\s*/, "").trim());
}

export function listItemsToText(items: string[]): string {
  return items.join("\n");
}

export function normalizeTermsItems(items: string[] | undefined): string[] {
  return (items ?? [])
    .map((item) => {
      const parsed = parseTourTermItem(item);
      return serializeTourTermItem({
        title: parsed.title.slice(0, ORGANIZER_TOUR_TERMS_ITEM_MAX),
        detail: parsed.detail?.slice(0, ORGANIZER_TOUR_TERMS_ITEM_DETAIL_MAX),
      });
    })
    .filter(Boolean);
}

export function normalizeFaqItems(items: OrganizerTourFAQ[] | undefined): OrganizerTourFAQ[] {
  return (items ?? []).map((item) => ({
    id: item.id?.trim() || createFaqItemId(),
    question: item.question.trim().slice(0, ORGANIZER_TOUR_FAQ_QUESTION_MAX),
    answer: trimHtmlToPlainTextLength(
      normalizeEditorValue(item.answer.trim()),
      ORGANIZER_TOUR_FAQ_ANSWER_MAX
    ),
  }));
}

export const DEFAULT_IGUAZU_INCLUDED: string[] = [
  "Отель у парка",
  "Завтраки",
  "Входные билеты",
  "Трансферы по программе",
  "Русскоязычный гид",
];

export const DEFAULT_IGUAZU_EXCLUDED: string[] = [
  "Международные авиабилеты",
  "Обеды и ужины",
  "Личные расходы",
  "Страховка",
];

export const DEFAULT_IGUAZU_IMPORTANT_INFO: string[] = [
  "Рекомендуем медицинскую страховку на весь период поездки",
  "Возьмите непромокаемую обувь и куртку — в парке влажно",
  "Для посещения бразильской стороны может понадобиться отдельная виза",
];

export const DEFAULT_IGUAZU_PACKING_LIST = `**Документы и деньги:**
• Загранпаспорт и страховка
• Наличные песо и карта для оплат

**Одежда и обувь:**
• Удобная обувь для прогулок по мосткам
• Лёгкая одежда и дождевик
• Головной убор и солнцезащитные очки

**Для защиты от солнца и насекомых:**
• Солнцезащитный крем SPF 50+
• Средство от насекомых

**Для комфорта:**
• Бутылка для воды
• Небольшой рюкзак, полотенце, перекус

**Гаджеты:**
• Смартфон или камера, power bank, зарядные устройства

Этот список поможет вам чувствовать себя комфортно и наслаждаться каждым моментом вашего путешествия к водопадам Игуасу!`;

export const DEFAULT_IGUAZU_FAQ: OrganizerTourFAQ[] = [
  {
    id: "iguazu-faq-1",
    question: "Нужна ли виза для поездки к водопадам?",
    answer:
      "Для аргентинской стороны достаточно действующего загранпаспорта. Для бразильской стороны уточняйте актуальные требования заранее.",
  },
  {
    id: "iguazu-faq-2",
    question: "Какой уровень физической подготовки нужен?",
    answer:
      "Маршрут рассчитан на обычный уровень активности: прогулки по мосткам и тропам без сложного набора высоты.",
  },
  {
    id: "iguazu-faq-3",
    question: "Можно ли отменить бронирование?",
    answer:
      "Условия отмены зависят от даты заезда. Подробности уточняйте у организатора при бронировании.",
  },
];
