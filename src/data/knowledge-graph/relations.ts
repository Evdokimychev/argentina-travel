import type { KnowledgeRelation } from "@/data/knowledge-graph/entities";

/** Рёбра графа знаний — дополняют автоматические связи places-relations */
export const KNOWLEDGE_RELATIONS: KnowledgeRelation[] = [
  { from: { type: "place", slug: "perito-moreno-glacier" }, to: { type: "place", slug: "el-calafate" }, relation: "geographic", label: "~80 км" },
  { from: { type: "place", slug: "perito-moreno-glacier" }, to: { type: "place", slug: "los-glaciares-national-park" }, relation: "parent" },
  { from: { type: "place", slug: "fitz-roy" }, to: { type: "place", slug: "el-chalten" }, relation: "geographic" },
  { from: { type: "place", slug: "fitz-roy" }, to: { type: "place", slug: "los-glaciares-national-park" }, relation: "parent" },
  { from: { type: "place", slug: "nahuel-huapi-national-park" }, to: { type: "place", slug: "bariloche" }, relation: "geographic" },
  { from: { type: "place", slug: "tierra-del-fuego-national-park" }, to: { type: "place", slug: "ushuaia" }, relation: "geographic" },
  { from: { type: "place", slug: "cerro-de-los-7-colores" }, to: { type: "place", slug: "purmamarca" }, relation: "geographic" },
  { from: { type: "place", slug: "tren-de-las-nubes" }, to: { type: "place", slug: "salta" }, relation: "geographic" },
  { from: { type: "collection", slug: "patagonia-highlights" }, to: { type: "place", slug: "perito-moreno-glacier" }, relation: "collection" },
  { from: { type: "collection", slug: "best-glaciers" }, to: { type: "place", slug: "perito-moreno-glacier" }, relation: "collection" },
  { from: { type: "itinerary", slug: "patagonia-classic-10-days" }, to: { type: "place", slug: "el-calafate" }, relation: "itinerary" },
  { from: { type: "place", slug: "talampaya" }, to: { type: "place", slug: "salta" }, relation: "geographic", label: "северо-запад" },
  { from: { type: "place", slug: "cordoba" }, to: { type: "place", slug: "buenos-aires" }, relation: "geographic", label: "~700 км" },
  { from: { type: "collection", slug: "unesco-heritage" }, to: { type: "place", slug: "talampaya" }, relation: "collection" },
  { from: { type: "collection", slug: "unesco-heritage" }, to: { type: "place", slug: "cordoba" }, relation: "collection" },
  { from: { type: "collection", slug: "wildlife-argentina" }, to: { type: "place", slug: "estero-ibera" }, relation: "collection" },
  { from: { type: "destination", slug: "patagonia" }, to: { type: "place", slug: "el-calafate" }, relation: "companion" },
  { from: { type: "destination", slug: "calafate" }, to: { type: "place", slug: "el-calafate" }, relation: "companion" },
  { from: { type: "destination", slug: "iguazu" }, to: { type: "place", slug: "iguazu-falls" }, relation: "companion" },
  { from: { type: "guide_topic", slug: "kak-dobratsya" }, to: { type: "place", slug: "buenos-aires" }, relation: "thematic" },
  { from: { type: "guide_topic", slug: "pogoda-i-sezonnost" }, to: { type: "place", slug: "el-calafate" }, relation: "thematic" },
  { from: { type: "guide_topic", slug: "kultura" }, to: { type: "place", slug: "buenos-aires" }, relation: "thematic" },
];
