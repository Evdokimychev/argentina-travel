import type { BlogRichArticle } from "@/types/blog-rich-article";
import { allArgentinaNationalParksArticle } from "./all-argentina-national-parks";
import { banadoLaEstrellaArticle } from "./banado-la-estrella";
import { iberaNationalParkArticle } from "./ibera-national-park";
import { iguazuNationalParkArticle } from "./iguazu-national-park";
import { laninNationalParkArticle } from "./lanin-national-park";
import { losAlercesNationalParkArticle } from "./los-alerces-national-park";
import { losGlaciaresNationalParkArticle } from "./los-glaciares-national-park";
import { losCardonesNationalParkArticle } from "./los-cardones-national-park";
import { nahuelHuapiNationalParkArticle } from "./nahuel-huapi-national-park";
import { patagoniaNationalParkArticle } from "./patagonia-national-park";
import { talampayaNationalParkArticle } from "./talampaya-national-park";
import { tierraDelFuegoNationalParkArticle } from "./tierra-del-fuego-national-park";
import { valdesPeninsulaNationalParkArticle } from "./valdes-peninsula-national-park";

const ARTICLES: Record<string, BlogRichArticle> = {
  "all-argentina-national-parks": allArgentinaNationalParksArticle,
  "banado-la-estrella": banadoLaEstrellaArticle,
  "iguazu-national-park": iguazuNationalParkArticle,
  "ibera-national-park": iberaNationalParkArticle,
  "lanin-national-park": laninNationalParkArticle,
  "los-alerces-national-park": losAlercesNationalParkArticle,
  "los-glaciares-national-park": losGlaciaresNationalParkArticle,
  "los-cardones-national-park": losCardonesNationalParkArticle,
  "nahuel-huapi-national-park": nahuelHuapiNationalParkArticle,
  "patagonia-national-park": patagoniaNationalParkArticle,
  "talampaya-national-park": talampayaNationalParkArticle,
  "tierra-del-fuego-national-park": tierraDelFuegoNationalParkArticle,
  "valdes-peninsula-national-park": valdesPeninsulaNationalParkArticle,
};

export function getBlogRichArticle(id: string): BlogRichArticle | undefined {
  return ARTICLES[id];
}

export function getBlogRichArticleToc(id: string): Array<{ id: string; label: string }> {
  const article = getBlogRichArticle(id);
  if (!article) return [];
  return article.sections.map((section) => ({ id: section.id, label: section.title }));
}
