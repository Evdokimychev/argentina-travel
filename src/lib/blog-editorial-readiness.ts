import type { BlogPost } from "@/types";

export type BlogEditorialIssueCode =
  | "ai_trace"
  | "development_trace"
  | "pseudo_citation"
  | "missing_editorial_review"
  | "missing_review_date"
  | "missing_official_source";

export type BlogEditorialIssue = {
  code: BlogEditorialIssueCode;
  severity: "blocking";
};

const AI_TRACE_RE = /(?:chatgpt|claude|как\s+(?:языковая|ии)[ -]модель|сгенерирован[аоы]?\s+(?:ии|нейросетью))/iu;
const DEVELOPMENT_TRACE_RE = /(?:\b(?:TODO|TBD)(?=\b|:)|\b(?:lorem ipsum|placeholder)\b|контент[- ]план|записи базы|внутренняя редакционная пометка)/u;
const PSEUDO_CITATION_RE = /\((?:reddit|kayak|т[—-]ж|форум винского|argentina travel)\)/iu;
const SENSITIVE_CATEGORY_RE = /^(?:Иммиграция|Деньги и обмен валют)$/u;
const SENSITIVE_SLUG_RE = /(?:visa|viza|vnzh|grazhdanstv|dni-cuil|bank|blue-dollar|money|byudzhet|stoimost-zhizni|kak-menyat|бюджет|деньги|валют|банк)/iu;
const OFFICIAL_SOURCE_RE = /https:\/\/(?:[^\s/]+\.)?(?:argentina\.gob\.ar|gob\.ar|buenosaires\.gob\.ar|migraciones\.gob\.ar|bcra\.gob\.ar|indec\.gob\.ar|arca\.gob\.ar|anmat\.gob\.ar|enacom\.gob\.ar|cancilleria\.gob\.ar|visa\.com|mastercard\.com)\b/iu;

export function isSensitiveBlogPost(post: BlogPost): boolean {
  return SENSITIVE_CATEGORY_RE.test(post.category) || SENSITIVE_SLUG_RE.test(post.slug);
}

export function getBlogPostVisibleEditorialText(post: BlogPost, richText = ""): string {
  return [
    post.title,
    post.excerpt,
    post.content,
    ...(post.sections ?? []).flatMap((section) => [section.title, section.body]),
    richText,
  ].join("\n");
}

export function getBlogEditorialIssues(post: BlogPost, richText = ""): BlogEditorialIssue[] {
  const text = getBlogPostVisibleEditorialText(post, richText);
  const issues: BlogEditorialIssue[] = [];

  if (AI_TRACE_RE.test(text)) issues.push({ code: "ai_trace", severity: "blocking" });
  if (DEVELOPMENT_TRACE_RE.test(text)) issues.push({ code: "development_trace", severity: "blocking" });
  if (PSEUDO_CITATION_RE.test(text)) issues.push({ code: "pseudo_citation", severity: "blocking" });
  if (post.editorialReviewed !== true) {
    issues.push({ code: "missing_editorial_review", severity: "blocking" });
  }

  if (isSensitiveBlogPost(post)) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(post.dateModified ?? "")) {
      issues.push({ code: "missing_review_date", severity: "blocking" });
    }
    if (!OFFICIAL_SOURCE_RE.test(text)) {
      issues.push({ code: "missing_official_source", severity: "blocking" });
    }
  }

  return issues;
}
