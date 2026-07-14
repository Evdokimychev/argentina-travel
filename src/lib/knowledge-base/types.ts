/**
 * Типы раздела «База знаний» (/baza-znaniy).
 * Источник данных — content/knowledge-base/ (сотни Markdown-записей),
 * читаемый через сгенерированные индексы _index/{content,navigation}.json.
 * Генератор индексов: content/knowledge-base/_index/build_manifest.py.
 */

export type KbEntryType =
  | "city"
  | "guide"
  | "faq"
  | "author_tip"
  | "national_park"
  | "attraction"
  | "region"
  | "route"
  | "transport";

export interface KbSource {
  title?: string;
  url?: string;
  lang?: string;
  type?: string;
  note?: string;
}

export interface KbMediaImage {
  url: string;
  alt?: string;
  author?: string;
  license?: string;
  source_page?: string;
}

export interface KbMedia {
  hero?: KbMediaImage;
  gallery?: KbMediaImage[];
}

export interface KbEditorialMeta {
  sensitive?: boolean;
  policy_days?: number;
  review_due_at?: string | null;
  review_due?: boolean;
  missing_sources?: boolean;
  source_count?: number;
  word_count?: number | null;
  needs_attention?: boolean;
}

/** Полная запись базы знаний (frontmatter + тело в Markdown). */
export interface KbEntry {
  id: string;
  type: KbEntryType;
  subtype?: string | null;
  title: string;
  title_es?: string | null;
  summary?: string;
  aliases?: string[];
  tags?: string[];
  site_sections?: string[];
  topic?: string | null;
  applies_to?: string | null;
  related?: string[];
  warnings?: string[];
  recommendations?: string[];
  sources?: KbSource[];
  media?: KbMedia | null;
  editorial?: KbEditorialMeta;
  status?: string;
  site_ready?: boolean | null;
  confidence?: string;
  last_verified?: string | null;
  seo_slug?: string | null;
  /** Гео-поля (для мест/регионов/карты; присутствуют у city/region/national_park/attraction). */
  coordinates?: { lat: number; lng: number } | null;
  region_id?: string | null;
  province?: string | null;
  how_to_get_there?: string | null;
  best_time?: string[] | null;
  cost?: { level?: string; details?: string } | null;
  duration?: string | null;
  body: string;
}

export interface KbNavSectionEntry {
  id: string;
  type: string;
  subtype?: string | null;
  title: string;
}

export interface KbNavSection {
  title: string;
  entries: KbNavSectionEntry[];
}

export interface KbNavigation {
  generated_at?: string;
  hubs: string[];
  sections: Record<string, KbNavSection>;
}

/** Метаданные канонического раздела для меню, хлебных крошек и категорий. */
export interface KbSectionMeta {
  /** id раздела (совпадает со значением site_sections) */
  id: string;
  /** URL-слаг раздела: /baza-znaniy/razdel/<slug> */
  slug: string;
  /** Название для меню/крошек */
  title: string;
  /** Короткое описание для карточки раздела */
  description: string;
  /** Эмодзи-иконка (лёгкая, без внешних зависимостей) */
  icon: string;
}

/** Облегчённая запись для клиентского поиска. */
export interface KbSearchItem {
  id: string;
  title: string;
  summary: string;
  type: KbEntryType;
  section: string;
  aliases: string[];
  tags: string[];
}
