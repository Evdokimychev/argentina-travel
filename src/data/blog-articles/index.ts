import type { BlogRichArticle } from "@/types/blog-rich-article";
import { iguazuNationalParkArticle } from "./iguazu-national-park";
import { losGlaciaresNationalParkArticle } from "./los-glaciares-national-park";
import { nahuelHuapiNationalParkArticle } from "./nahuel-huapi-national-park";
import { tierraDelFuegoNationalParkArticle } from "./tierra-del-fuego-national-park";

const ARTICLES: Record<string, BlogRichArticle> = {
  "iguazu-national-park": iguazuNationalParkArticle,
  "los-glaciares-national-park": losGlaciaresNationalParkArticle,
  "nahuel-huapi-national-park": nahuelHuapiNationalParkArticle,
  "tierra-del-fuego-national-park": tierraDelFuegoNationalParkArticle,
};

export function getBlogRichArticle(id: string): BlogRichArticle | undefined {
  return ARTICLES[id];
}

export function getBlogRichArticleToc(id: string): Array<{ id: string; label: string }> {
  const article = getBlogRichArticle(id);
  if (!article) return [];
  return article.sections.map((section) => ({ id: section.id, label: section.title }));
}
