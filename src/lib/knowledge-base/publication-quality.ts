import type { KbEntry } from "./types";

const MIXED_SCRIPT_WORD_RE = /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/gu;
const LATIN_RE = /\p{Script=Latin}/u;
const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
const PLACEHOLDER_RE = /\b(?:placeholder|lorem ipsum|todo|tbd|undefined|null)\b/i;
const MACHINE_TRANSLATION_MARKER_RE = /автоперевод|требует редакторской вычитки/i;
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
  | "thin_content"
  | "missing_hero";

export function getPublicationIssues(entry: KbEntry): PublicationIssue[] {
  const issues: PublicationIssue[] = [];
  const title = entry.title ?? "";
  const summary = entry.summary ?? "";
  const visibleText = `${title} ${summary} ${entry.body ?? ""}`;
  const titleScripts = scriptCounts(title);
  const summaryScripts = scriptCounts(summary);

  if (entry.site_ready === false) issues.push("not_publication_ready");
  if (hasMixedScriptWord(visibleText)) issues.push("mixed_script_word");
  if (titleScripts.latin >= 4 && titleScripts.cyrillic === 0) issues.push("non_russian_title");
  if (summaryScripts.latin >= 20 && summaryScripts.latin > summaryScripts.cyrillic * 2) {
    issues.push("non_russian_summary");
  }
  if (PLACEHOLDER_RE.test(visibleText)) issues.push("placeholder_content");
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
    typeof entry.editorial?.word_count === "number" &&
    entry.editorial.word_count < 120
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
