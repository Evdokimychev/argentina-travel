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
  /** Стабильный kebab-case id для связи с проверяемыми утверждениями. */
  id?: string;
  title?: string;
  url?: string;
  lang?: string;
  type?: string;
  note?: string;
  authority?: "primary" | "secondary" | "community";
  url_status?: "verified" | "redirected" | "unreachable" | "unchecked";
  checked_at?: string;
  expires_at?: string | null;
}

export interface KbClaimReviewer {
  /** Стабильный внутренний id редактора или проверяющей роли, не секрет и не email. */
  id: string;
  role?: string;
}

export interface KbClaim {
  id: string;
  text: string;
  sensitive?: boolean;
  source_ids: string[];
  verified_at?: string;
  reviewer?: string | KbClaimReviewer;
}

export interface KbProvenanceConfig {
  schema_version: 1;
  mode: "diagnostic" | "strict";
  stale_after_days?: number;
}

export type KbProvenanceIssueCode =
  | "broken_claim_source_ref"
  | "claim_without_sources"
  | "duplicate_claim_id"
  | "duplicate_source_id"
  | "expired_source"
  | "invalid_claim"
  | "invalid_claim_id"
  | "invalid_claim_registry"
  | "invalid_provenance_mode"
  | "invalid_source"
  | "invalid_source_expiry"
  | "invalid_source_id"
  | "invalid_source_url"
  | "invalid_stale_after_days"
  | "missing_claim_id"
  | "missing_claim_text"
  | "missing_sensitive_claim_mapping"
  | "missing_source_authority"
  | "missing_source_checked_at"
  | "missing_source_id"
  | "missing_source_url_health"
  | "sensitive_claim_missing_reviewer"
  | "sensitive_claim_missing_verified_at"
  | "sensitive_claim_without_primary_source"
  | "stale_sensitive_claim"
  | "stale_source_url_check"
  | "unhealthy_source_url"
  | "unsupported_provenance_schema";

export interface KbProvenanceMeta {
  schema_version: 1;
  applicable: boolean;
  declared: boolean;
  mode: "diagnostic" | "strict";
  strict_ready: boolean;
  issue_count: number;
  issue_codes: KbProvenanceIssueCode[];
  source_count: number;
  identified_source_count: number;
  claim_count: number;
  sensitive_claim_count: number;
  stale_after_days: number;
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
  primary_source_count?: number;
  missing_primary_source?: boolean;
  missing_reviewer?: boolean;
  missing_media_rights?: boolean;
  source_count?: number;
  word_count?: number | null;
  needs_attention?: boolean;
  provenance?: KbProvenanceMeta;
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
  claims?: KbClaim[];
  provenance?: KbProvenanceConfig | null;
  media?: KbMedia | null;
  editorial?: KbEditorialMeta;
  status?: string;
  site_ready?: boolean | null;
  confidence?: string;
  last_verified?: string | null;
  reviewer?: string | null;
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
