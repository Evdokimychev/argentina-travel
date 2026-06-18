/** Типы сущностей базы знаний об Аргентине */

export type KnowledgeEntityType =
  | "place"
  | "region"
  | "destination"
  | "collection"
  | "itinerary"
  | "guide_topic"
  | "guide_article"
  | "blog_article";

export type KnowledgeEntityRef = {
  type: KnowledgeEntityType;
  slug: string;
  title: string;
  href: string;
};

export type KnowledgeRelationType =
  | "geographic"
  | "thematic"
  | "parent"
  | "collection"
  | "itinerary"
  | "companion";

export type KnowledgeRelation = {
  from: { type: KnowledgeEntityType; slug: string };
  to: { type: KnowledgeEntityType; slug: string };
  relation: KnowledgeRelationType;
  label?: string;
};

/**
 * Направления каталога ↔ карточка места в справочнике.
 * Регион «Патагония» не привязан к одному месту — см. PATAGONIA_PLACE_SLUGS.
 */
export const DESTINATION_TO_PLACE: Record<string, string> = {
  ba: "buenos-aires",
  bariloche: "bariloche",
  calafate: "el-calafate",
  ushuaia: "ushuaia",
  mendoza: "mendoza",
  salta: "salta",
  iguazu: "iguazu-falls",
};

/** Обратная связь: одно место → одно направление (без patagonia). */
export const PLACE_TO_DESTINATION: Record<string, string> = {
  "buenos-aires": "ba",
  bariloche: "bariloche",
  "el-calafate": "calafate",
  ushuaia: "ushuaia",
  mendoza: "mendoza",
  salta: "salta",
  "iguazu-falls": "iguazu",
};

/** Ключевые места региона «Патагония» для перекрёстных ссылок. */
export const PATAGONIA_PLACE_SLUGS = [
  "el-calafate",
  "el-chalten",
  "perito-moreno-glacier",
  "bariloche",
  "ushuaia",
  "los-glaciares-national-park",
] as const;
