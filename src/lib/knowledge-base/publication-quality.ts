import type { KbEntry } from "./types";

const MIXED_SCRIPT_WORD_RE = /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/gu;
const LATIN_RE = /\p{Script=Latin}/u;
const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
const PLACEHOLDER_RE = /\b(?:placeholder|lorem ipsum|tbd|undefined|null)\b/i;
const TODO_MARKER_RE = /\bTODO\b/;
const MACHINE_TRANSLATION_MARKER_RE =
  /текст\s+автоперевед[её]н|требует редакторской вычитки/i;
const INTERNAL_EDITORIAL_MARKER_RE =
  /См\.\s*`?(?:recommendations|warnings)`?\s*в метаданных|Архивный лонгрид|в корне проекта/i;
const MALFORMED_HEADING_RE =
  /(?:^|\n)#{1,6}\s+[^\n]+?[ \t]+#{1,6}\s+\S|(?:^|\n)##\s+(?:Описание|Факты|Источники|Рекомендации|Предупреждения|Рекомендации \/ Предупреждения|Связанные объекты|Как добраться|Когда ехать)[ \t]+\S/m;

function scriptCounts(value: string): { cyrillic: number; latin: number } {
  return {
    cyrillic: value.match(/\p{Script=Cyrillic}/gu)?.length ?? 0,
    latin: value.match(/\p{Script=Latin}/gu)?.length ?? 0,
  };
}

function hasMixedScriptWord(value: string): boolean {
  return (value.match(MIXED_SCRIPT_WORD_RE) ?? []).some((word) =>
    word
      .split("-")
      .some((part) => LATIN_RE.test(part) && CYRILLIC_RE.test(part)),
  );
}

function hasVerifiableSource(entry: Pick<KbEntry, "sources">): boolean {
  return (entry.sources ?? []).some((source) =>
    /^https?:\/\/\S+$/i.test(source.url?.trim() ?? ""),
  );
}

export type PublicationIssue =
  | "not_publication_ready"
  | "mixed_script_word"
  | "non_russian_title"
  | "non_russian_summary"
  | "placeholder_content"
  | "machine_translation_marker"
  | "internal_editorial_marker"
  | "malformed_markdown_heading"
  | "missing_sensitive_source"
  | "missing_source"
  | "verification_due"
  | "missing_author"
  | "unverified_personal_authorship"
  | "sensitive_provenance_not_ready"
  | "thin_content"
  | "missing_hero";

/**
 * Минимальная глубина зависит от задачи материала. Короткий FAQ может дать
 * законченный ответ, но такой же объём не делает полноценным маршрут, город
 * или практическое руководство. Значения совпадают с редакционной моделью
 * инвентаризации в scripts/generate-content-overhaul-inventory.ts.
 */
export const KB_MIN_WORDS_BY_TYPE: Readonly<Record<KbEntry["type"], number>> = {
  attraction: 500,
  national_park: 500,
  city: 500,
  region: 800,
  route: 800,
  transport: 600,
  guide: 600,
  faq: 120,
  author_tip: 250,
};

export function getKbMinimumWordCount(entry: Pick<KbEntry, "type">): number {
  return KB_MIN_WORDS_BY_TYPE[entry.type];
}

export function getPublicationIssues(entry: KbEntry): PublicationIssue[] {
  const issues: PublicationIssue[] = [];
  const intentionalArchive =
    entry.status === "archived" &&
    entry.site_ready === false &&
    Boolean(entry.redirect_to?.trim()) &&
    Boolean(entry.archive_reason?.trim());
  if (intentionalArchive) return issues;
  const title = entry.title ?? "";
  const summary = entry.summary ?? "";
  const visibleText = `${title} ${summary} ${entry.body ?? ""}`;
  const titleScripts = scriptCounts(title);
  const summaryScripts = scriptCounts(summary);

  if (entry.status !== "published" || entry.site_ready === false) {
    issues.push("not_publication_ready");
  }
  if (hasMixedScriptWord(visibleText)) issues.push("mixed_script_word");
  if (titleScripts.latin >= 4 && titleScripts.cyrillic === 0) issues.push("non_russian_title");
  if (summaryScripts.latin >= 20 && summaryScripts.latin > summaryScripts.cyrillic * 2) {
    issues.push("non_russian_summary");
  }
  if (PLACEHOLDER_RE.test(visibleText) || TODO_MARKER_RE.test(visibleText)) {
    issues.push("placeholder_content");
  }
  if (MACHINE_TRANSLATION_MARKER_RE.test(visibleText)) {
    issues.push("machine_translation_marker");
  }
  if (INTERNAL_EDITORIAL_MARKER_RE.test(visibleText)) {
    issues.push("internal_editorial_marker");
  }
  if (MALFORMED_HEADING_RE.test(entry.body ?? "")) {
    issues.push("malformed_markdown_heading");
  }
  if (entry.editorial?.sensitive && entry.editorial.missing_sources) {
    issues.push("missing_sensitive_source");
  }
  if (
    entry.status === "published" &&
    entry.type !== "author_tip" &&
    !hasVerifiableSource(entry)
  ) {
    issues.push("missing_source");
  }
  if (entry.editorial?.review_due) {
    issues.push("verification_due");
  }
  if (entry.type === "author_tip" && entry.personal_experience) {
    if (!entry.verified_by_ivan) issues.push("unverified_personal_authorship");
    if (!entry.author_name?.trim()) issues.push("missing_author");
  }
  const provenanceMode = entry.provenance?.mode ?? entry.editorial?.provenance?.mode;
  if (
    entry.editorial?.sensitive &&
    provenanceMode === "strict" &&
    entry.editorial?.provenance?.strict_ready !== true
  ) {
    issues.push("sensitive_provenance_not_ready");
  }
  if (
    entry.status === "published" &&
    typeof entry.editorial?.word_count === "number" &&
    entry.editorial.word_count < getKbMinimumWordCount(entry)
  ) {
    issues.push("thin_content");
  }
  if (
    entry.site_ready === true &&
    !entry.media?.hero &&
    ["city", "national_park", "attraction", "region", "route"].includes(entry.type)
  ) {
    issues.push("missing_hero");
  }

  return [...new Set(issues)];
}

export function isPublicKbEntry(entry: KbEntry): boolean {
  if (entry.status !== "published") return false;
  return getPublicationIssues(entry).length === 0;
}

/**
 * Отдельный fail-closed сигнал для release readiness. В диагностическом режиме
 * он не меняет текущую выдачу, но чувствительный материал без claim-level
 * доказательств никогда не получает строгий статус готовности.
 */
export function getStrictPublicationIssues(entry: KbEntry): PublicationIssue[] {
  const issues = getPublicationIssues(entry);
  if (
    entry.editorial?.sensitive &&
    entry.editorial?.provenance?.strict_ready !== true
  ) {
    issues.push("sensitive_provenance_not_ready");
  }
  return [...new Set(issues)];
}

export function isStrictPublicationReady(entry: KbEntry): boolean {
  if (entry.status !== "published") return false;
  return getStrictPublicationIssues(entry).length === 0;
}
