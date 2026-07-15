/**
 * Человекочитаемые подписи типов записей (клиент-безопасно, без fs).
 * Русские термины по редакционному стандарту проекта (без «гайд» и т. п.).
 */
import type { KbEntryType } from "./types";

export const KB_TYPE_LABELS: Record<KbEntryType, string> = {
  city: "Город",
  region: "Регион",
  national_park: "Национальный парк",
  attraction: "Достопримечательность",
  route: "Маршрут",
  transport: "Транспорт",
  guide: "Руководство",
  faq: "Вопрос-ответ",
  author_tip: "Совет путешественнику",
};

export function kbTypeLabel(type: string): string {
  return (KB_TYPE_LABELS as Record<string, string>)[type] ?? type;
}
