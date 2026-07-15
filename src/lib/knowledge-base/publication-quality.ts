import type { KbEntry } from "./types";

const MIXED_SCRIPT_WORD_RE = /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/u;
const PLACEHOLDER_RE = /\b(?:placeholder|lorem ipsum|todo|tbd|undefined|null)\b/i;

function scriptCounts(value: string): { cyrillic: number; latin: number } {
  return {
    cyrillic: value.match(/\p{Script=Cyrillic}/gu)?.length ?? 0,
    latin: value.match(/\p{Script=Latin}/gu)?.length ?? 0,
  };
}

export type PublicationIssue =
  | "not_publication_ready"
  | "mixed_script_word"
  | "non_russian_title"
  | "non_russian_summary"
  | "placeholder_content"
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
  const titleScripts = scriptCounts(title);
  const summaryScripts = scriptCounts(summary);

  if (entry.site_ready === false) issues.push("not_publication_ready");
  if (MIXED_SCRIPT_WORD_RE.test(visibleText)) issues.push("mixed_script_word");
  if (titleScripts.latin >= 4 && titleScripts.cyrillic === 0) issues.push("non_russian_title");
  if (summaryScripts.latin >= 20 && summaryScripts.latin > summaryScripts.cyrillic * 2) {
    issues.push("non_russian_summary");
  }
  if (PLACEHOLDER_RE.test(visibleText)) issues.push("placeholder_content");
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
