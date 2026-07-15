import type { KbEntry } from "./types";

const MIXED_SCRIPT_WORD_RE = /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/u;
const PLACEHOLDER_RE = /\b(?:placeholder|lorem ipsum|todo|tbd|undefined|null)\b/i;
const EDITORIAL_ARTIFACT_RE =
  /(?:автоперевод|требует редакторской вычитки|черновик из контент-плана|контент-план|заглушка api|в разработке|следующ(?:ей|их) итерац|полная ai-генерация|chatgpt|openai|навигационная точка входа|готовые скелеты|польза важнее продажи|полный тематический гид|общие справочные данные[^.\n;]*[;,]\s*факты сверены)/i;

function scriptCounts(value: string): { cyrillic: number; latin: number } {
  return {
    cyrillic: value.match(/\p{Script=Cyrillic}/gu)?.length ?? 0,
    latin: value.match(/\p{Script=Latin}/gu)?.length ?? 0,
  };
}

export type PublicationIssue =
  | "not_publication_ready"
  | "mixed_script_word"
  | "mixed_script_body"
  | "non_russian_title"
  | "mixed_script_title"
  | "non_russian_summary"
  | "non_russian_body"
  | "placeholder_content"
  | "editorial_artifact"
  | "thin_content"
  | "low_confidence"
  | "missing_sensitive_source"
  | "missing_primary_source"
  | "missing_sensitive_reviewer"
  | "verification_due"
  | "missing_media_rights";

export function getPublicationIssues(entry: KbEntry): PublicationIssue[] {
  const issues: PublicationIssue[] = [];
  const title = entry.title ?? "";
  const summary = entry.summary ?? "";
  const visibleText = `${title} ${summary}`;
  const fullText = `${visibleText} ${entry.body ?? ""}`;
  const titleScripts = scriptCounts(title);
  const summaryScripts = scriptCounts(summary);

  if (entry.site_ready === false) issues.push("not_publication_ready");
  if (MIXED_SCRIPT_WORD_RE.test(visibleText)) issues.push("mixed_script_word");
  if (MIXED_SCRIPT_WORD_RE.test(entry.body ?? "")) issues.push("mixed_script_body");
  if (titleScripts.latin >= 4 && titleScripts.cyrillic === 0) issues.push("non_russian_title");
  if (titleScripts.latin >= 4 && titleScripts.cyrillic >= 4) issues.push("mixed_script_title");
  if (summaryScripts.latin >= 20 && summaryScripts.latin > summaryScripts.cyrillic * 2) {
    issues.push("non_russian_summary");
  }
  const bodyWithoutSources = (entry.body ?? "").split(/\n##\s+Источники/i)[0] ?? "";
  const hasNonRussianParagraph = bodyWithoutSources.split(/\n+/).some((paragraph) => {
    const prose = paragraph.replace(/https?:\/\/\S+/g, " ");
    const counts = scriptCounts(prose);
    return counts.latin >= 80 && counts.latin > counts.cyrillic * 2;
  });
  if (hasNonRussianParagraph) issues.push("non_russian_body");
  if (PLACEHOLDER_RE.test(visibleText)) issues.push("placeholder_content");
  if (EDITORIAL_ARTIFACT_RE.test(fullText)) issues.push("editorial_artifact");
  if (
    typeof entry.editorial?.word_count === "number" &&
    entry.editorial.word_count < 100
  ) {
    issues.push("thin_content");
  }
  if (entry.confidence === "low") issues.push("low_confidence");
  if (entry.editorial?.sensitive && entry.editorial.missing_sources) {
    issues.push("missing_sensitive_source");
  }
  if (entry.editorial?.sensitive && entry.editorial.missing_primary_source) {
    issues.push("missing_primary_source");
  }
  if (entry.editorial?.sensitive && entry.editorial.missing_reviewer) {
    issues.push("missing_sensitive_reviewer");
  }
  if (entry.editorial?.review_due) issues.push("verification_due");
  if (entry.editorial?.missing_media_rights) issues.push("missing_media_rights");

  return [...new Set(issues)];
}

export function isPublicKbEntry(entry: KbEntry): boolean {
  if (entry.status !== "published") return false;
  return getPublicationIssues(entry).length === 0;
}
