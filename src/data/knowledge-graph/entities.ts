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

/** Направления каталога ↔ места справочника (разные роли, не дубликаты) */
export const DESTINATION_TO_PLACE: Record<string, string> = {
  ba: "buenos-aires",
  bariloche: "bariloche",
  calafate: "el-calafate",
  ushuaia: "ushuaia",
  mendoza: "mendoza",
  salta: "salta",
  iguazu: "iguazu-falls",
  patagonia: "el-calafate",
};

export const PLACE_TO_DESTINATION: Record<string, string> = Object.fromEntries(
  Object.entries(DESTINATION_TO_PLACE).map(([dest, place]) => [place, dest]),
);
