import type { EditorialLocale } from "@/editorial/types";

const LABELS = {
  ru: {
    "block.lead": "Лид",
    "block.photo": "Фотоблок",
    "block.gallery": "Галерея",
    "block.callout": "Выноска",
    "block.faq": "Частые вопросы",
    "block.sources": "Источники",
    "block.countryTip": "Совет для русскоязычных",
    "block.phrasebook": "Разговорник",
    "block.optionSelector": "Выбор варианта",
    "block.articleSummary": "Коротко о главном",
    "block.prosCons": "Плюсы и минусы",
    "action.copy": "Копировать",
    "action.copied": "Скопировано",
    "action.source": "Источник",
    "action.more": "Подробнее",
    "label.recommendation": "Рекомендация",
    "label.pros": "Плюсы",
    "label.cons": "Минусы",
  },
  es: {
    "block.lead": "Entrada",
    "block.photo": "Bloque de foto",
    "block.gallery": "Galería",
    "block.callout": "Nota",
    "block.faq": "Preguntas frecuentes",
    "block.sources": "Fuentes",
    "block.countryTip": "Consejo para lectores rusohablantes",
    "block.phrasebook": "Frases útiles",
    "block.optionSelector": "Selector de opciones",
    "block.articleSummary": "En resumen",
    "block.prosCons": "Pros y contras",
    "action.copy": "Copiar",
    "action.copied": "Copiado",
    "action.source": "Fuente",
    "action.more": "Más información",
    "label.recommendation": "Recomendación",
    "label.pros": "Pros",
    "label.cons": "Contras",
  },
  en: {
    "block.lead": "Lead",
    "block.photo": "Photo block",
    "block.gallery": "Gallery",
    "block.callout": "Callout",
    "block.faq": "FAQ",
    "block.sources": "Sources",
    "block.countryTip": "Tip for Russian-speaking readers",
    "block.phrasebook": "Phrasebook",
    "block.optionSelector": "Option selector",
    "block.articleSummary": "At a glance",
    "block.prosCons": "Pros and cons",
    "action.copy": "Copy",
    "action.copied": "Copied",
    "action.source": "Source",
    "action.more": "Read more",
    "label.recommendation": "Recommendation",
    "label.pros": "Pros",
    "label.cons": "Cons",
  },
} as const;

export type EditorialLabelKey = keyof (typeof LABELS)["ru"];

export function editorialLabel(
  key: EditorialLabelKey,
  locale: EditorialLocale = "ru",
): string {
  return LABELS[locale][key] ?? LABELS.ru[key] ?? key;
}

export function formatEditorialDate(
  value: string | Date,
  locale: EditorialLocale = "ru",
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  const tag = locale === "en" ? "en-GB" : locale === "es" ? "es-AR" : "ru-RU";
  return new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatEditorialNumber(
  value: number,
  locale: EditorialLocale = "ru",
): string {
  const tag = locale === "en" ? "en-US" : locale === "es" ? "es-AR" : "ru-RU";
  return new Intl.NumberFormat(tag).format(value);
}
