import type { ImageQuery, ImageRole } from "./types";
import { generateImageAlt, generateImageDescription, generateImageTitle } from "./seo";

export interface QueryBuilderInput {
  pageId: string;
  pageTitle: string;
  category?: string;
  region?: string;
  keywords?: string[];
  role: ImageRole;
  sectionId?: string;
  sectionLabel?: string;
  fallbackIds?: string[];
  localPath?: string;
}

/** Theme → English search terms for stock APIs. */
const THEME_QUERIES: Record<string, string[]> = {
  patagonia: ["Patagonia mountains glacier trekking Argentina"],
  "buenos-aires": ["Buenos Aires architecture tango cityscape Argentina"],
  ba: ["Buenos Aires architecture tango cityscape Argentina"],
  bariloche: ["Bariloche lake Andes Argentina"],
  mendoza: ["Mendoza vineyards wine Andes Argentina"],
  salta: ["Salta northwest Argentina mountains colonial"],
  iguazu: ["Iguazu waterfalls jungle Argentina"],
  ushuaia: ["Ushuaia Tierra del Fuego end of world Argentina"],
  calafate: ["El Calafate Perito Moreno glacier Argentina"],
  nature: ["Argentina nature landscape national park"],
  city: ["Argentina city urban architecture"],
  culture: ["Argentina culture tango gaucho tradition"],
  food: ["Argentina steak asado wine cuisine"],
  transport: ["Argentina travel transport bus airplane"],
  landmarks: ["Argentina landmark monument tourist"],
  wine: ["Mendoza wine vineyard Argentina"],
  glacier: ["Patagonia glacier Perito Moreno Argentina"],
  falls: ["Iguazu waterfalls Argentina Brazil"],
  tango: ["Buenos Aires tango milonga Argentina"],
  penguins: ["Patagonia penguins wildlife Argentina"],
  mountains: ["Andes mountains Argentina trekking"],
  wildlife: ["Argentina wildlife nature national park"],
  panorama: ["Argentina landscape panorama wide view"],
  trails: ["Argentina hiking trail national park"],
  vegetation: ["Argentina forest jungle flora nature"],
  immigration: ["Buenos Aires city life Argentina expat"],
};

const NATIONAL_PARK_GALLERY: Record<string, string[]> = {
  "iguazu-national-park": [
    "Iguazu waterfalls panorama Argentina",
    "Iguazu jungle wildlife toucan Argentina",
    "Garganta del Diablo Iguazu landmark",
    "Iguazu national park trail boardwalk",
    "Atlantic rainforest vegetation Iguazu",
  ],
  "nahuel-huapi-national-park": [
    "Nahuel Huapi lake panorama Bariloche",
    "Patagonia wildlife deer Argentina",
    "Bariloche Andes landmark Argentina",
    "Patagonia hiking trail forest",
    "Andean forest vegetation Argentina",
  ],
  "los-glaciares-national-park": [
    "Perito Moreno glacier panorama Patagonia",
    "Patagonia guanaco wildlife Argentina",
    "Fitz Roy El Chalten landmark",
    "Patagonia trekking trail glacier",
    "Patagonia steppe vegetation Argentina",
  ],
  "tierra-del-fuego-national-park": [
    "Tierra del Fuego Beagle Channel panorama",
    "Patagonia fox wildlife Argentina",
    "End of the world Ushuaia landmark",
    "Tierra del Fuego forest trail",
    "Subantarctic forest vegetation Argentina",
  ],
};

function extractThemeKey(pageId: string, region?: string): string | undefined {
  if (region) return region;
  const parts = pageId.split(":");
  const last = parts[parts.length - 1];
  if (THEME_QUERIES[last]) return last;
  if (pageId.startsWith("rich:")) return pageId.replace("rich:", "");
  if (pageId.startsWith("destination:")) return parts[1];
  if (pageId.startsWith("podbor:region:")) return parts[2];
  if (pageId.startsWith("podbor:theme:")) return parts[2];
  return undefined;
}

function baseQuery(input: QueryBuilderInput): string {
  const themeKey = extractThemeKey(input.pageId, input.region);
  if (themeKey && THEME_QUERIES[themeKey]) {
    return THEME_QUERIES[themeKey][0];
  }
  if (input.keywords?.length) {
    return `${input.keywords.join(" ")} Argentina`;
  }
  return `${input.pageTitle} Argentina travel`;
}

export function buildSearchQuery(input: QueryBuilderInput): string {
  const articleId = input.pageId.startsWith("rich:") ? input.pageId.replace("rich:", "") : undefined;

  if (input.role === "gallery" && articleId) {
    const queries = NATIONAL_PARK_GALLERY[articleId];
    const idx = input.sectionId ? parseInt(input.sectionId, 10) : 0;
    if (queries) {
      return queries[Math.min(idx, queries.length - 1)] ?? queries[0];
    }
    const label = articleId.replace(/-/g, " ");
    return `${label} Argentina national park photo ${idx + 1}`;
  }

  if (input.sectionId && THEME_QUERIES[input.sectionId]) {
    return THEME_QUERIES[input.sectionId][0];
  }

  return baseQuery(input);
}

export function buildImageQuery(input: QueryBuilderInput): ImageQuery {
  const seoCtx = {
    pageTitle: input.pageTitle,
    category: input.category,
    region: input.region,
    keywords: input.keywords,
    role: input.role,
    sectionLabel: input.sectionLabel,
  };

  return {
    query: buildSearchQuery(input),
    role: input.role,
    alt: generateImageAlt(seoCtx),
    title: generateImageTitle(seoCtx),
    description: generateImageDescription(seoCtx),
    fallbackIds: input.fallbackIds,
    localPath: input.localPath,
  };
}

export function buildDestinationCardQueries(
  destinationId: string,
  label: string,
): Record<string, ImageQuery> {
  const themes = ["nature", "city", "culture", "food", "transport", "landmarks"] as const;
  const result: Record<string, ImageQuery> = {};

  for (const theme of themes) {
    result[theme] = buildImageQuery({
      pageId: `destination:${destinationId}`,
      pageTitle: label,
      region: destinationId,
      role: "card",
      sectionId: theme,
      sectionLabel: theme,
    });
  }

  return result;
}
