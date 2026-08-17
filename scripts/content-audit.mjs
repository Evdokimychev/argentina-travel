import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "content/knowledge-base/_index/content.json");
const outputPath = path.join(root, "var/ops/content-audit.json");
const fixPath = path.join(root, "var/ops/content-fix-manifest.json");
const reportPath = path.join(root, "docs/audit/content-audit-2026-07-14.md");
const MIXED_RE = /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/gu;
// Keep these markers deliberately narrow: Spanish `todo` and user-facing advice
// such as "отключите автоперевод" are legitimate copy, not editorial placeholders.
const PLACEHOLDER_RE = /\b(?:placeholder|lorem ipsum|tbd|undefined|null)\b/i;
const TODO_MARKER_RE = /\bTODO\b/;
const MACHINE_TRANSLATION_MARKER_RE = /текст\s+автоперевед[её]н|требует редакторской вычитки/i;
const INTERNAL_EDITORIAL_MARKER_RE =
  /См\.\s*`?(?:recommendations|warnings)`?\s*в метаданных|Архивный лонгрид|в корне проекта/i;
/**
 * Keep in sync with src/lib/knowledge-base/publication-quality.ts.
 * Do not treat legitimate multi-word titles like «Когда ехать и сколько времени»
 * as malformed — those are prefixes of common park/city templates.
 */
const MALFORMED_HEADING_RE =
  /(?:^|\n)#{1,6}\s+[^\n]+?[ \t]+#{1,6}\s+\S|(?:^|\n)##\s+(?:Описание|Факты|Источники|Рекомендации|Предупреждения|Рекомендации \/ Предупреждения|Связанные объекты)[ \t]+\S/m;
const MIN_WORDS_BY_TYPE = {
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

function hasMixedScriptWord(value = "") {
  return (String(value).match(MIXED_RE) ?? []).some((word) =>
    word
      .split("-")
      .some((part) => /\p{Script=Latin}/u.test(part) && /\p{Script=Cyrillic}/u.test(part)),
  );
}

function scripts(value = "") {
  const text = String(value ?? "");
  return {
    ru: text.match(/\p{Script=Cyrillic}/gu)?.length ?? 0,
    latin: text.match(/\p{Script=Latin}/gu)?.length ?? 0,
  };
}

function language(value = "") {
  const count = scripts(value);
  if (count.ru === 0 && count.latin === 0) return "undetermined";
  if (count.ru > count.latin * 2) return "ru";
  if (count.latin > count.ru * 2) return "es-or-en";
  return "mixed";
}

function issuesFor(entry) {
  const issues = [];
  const intentionalArchive =
    entry.status === "archived" &&
    entry.site_ready === false &&
    typeof entry.redirect_to === "string" &&
    entry.redirect_to.trim().length > 0 &&
    typeof entry.archive_reason === "string" &&
    entry.archive_reason.trim().length > 0;
  if (intentionalArchive) return issues;
  const title = entry.title ?? "";
  const summary = entry.summary ?? "";
  const visible = `${title} ${summary} ${entry.body ?? ""}`;
  const titleScript = scripts(title);
  const summaryScript = scripts(summary);
  const mixedWords = (visible.match(MIXED_RE) ?? []).filter(hasMixedScriptWord);
  if (!intentionalArchive && (entry.status !== "published" || entry.site_ready === false)) {
    issues.push({ code: "not_publication_ready", severity: "critical" });
  }
  if (mixedWords.length) issues.push({ code: "mixed_script_word", severity: "critical", values: mixedWords });
  if (titleScript.latin >= 4 && titleScript.ru === 0) issues.push({ code: "non_russian_title", severity: "critical" });
  if (summaryScript.latin >= 20 && summaryScript.latin > summaryScript.ru * 2) issues.push({ code: "non_russian_summary", severity: "critical" });
  if (PLACEHOLDER_RE.test(visible) || TODO_MARKER_RE.test(visible)) {
    issues.push({ code: "placeholder_content", severity: "critical" });
  }
  if (MACHINE_TRANSLATION_MARKER_RE.test(visible)) issues.push({ code: "machine_translation_marker", severity: "critical" });
  if (INTERNAL_EDITORIAL_MARKER_RE.test(visible)) issues.push({ code: "internal_editorial_marker", severity: "critical" });
  if (MALFORMED_HEADING_RE.test(entry.body ?? "")) issues.push({ code: "malformed_markdown_heading", severity: "critical" });
  if (entry.editorial?.sensitive && entry.editorial?.missing_sources) issues.push({ code: "missing_sensitive_source", severity: "critical" });
  const sourceCount = (entry.sources ?? []).filter((source) =>
    /^https?:\/\/\S+$/i.test(source.url?.trim() ?? ""),
  ).length;
  if (entry.status === "published" && entry.type !== "author_tip" && sourceCount === 0) {
    issues.push({ code: "missing_source", severity: "high" });
  }
  if (entry.editorial?.sensitive && entry.editorial?.missing_primary_source) issues.push({ code: "missing_primary_source", severity: "critical" });
  if (entry.editorial?.sensitive && entry.editorial?.missing_reviewer) issues.push({ code: "missing_sensitive_reviewer", severity: "critical" });
  if (
    entry.editorial?.sensitive &&
    entry.provenance?.mode === "strict" &&
    entry.editorial?.provenance?.strict_ready !== true
  ) {
    issues.push({ code: "sensitive_provenance_not_ready", severity: "critical" });
  }
  if (entry.editorial?.missing_media_rights) issues.push({ code: "missing_media_rights", severity: "critical" });
  const minimumWords = MIN_WORDS_BY_TYPE[entry.type] ?? 400;
  if (entry.status === "published" && (entry.editorial?.word_count ?? 0) < minimumWords) {
    issues.push({ code: "thin_content", severity: "high", minimumWords });
  }
  if (entry.site_ready && !entry.media?.hero && ["city", "national_park", "attraction", "region", "route"].includes(entry.type)) {
    issues.push({ code: "missing_hero", severity: "high" });
  }
  if (entry.status === "published" && entry.editorial?.review_due) {
    issues.push({ code: "verification_due", severity: "critical" });
  }
  if (entry.status === "published" && entry.type === "author_tip" && entry.personal_experience) {
    if (!entry.verified_by_ivan) {
      issues.push({ code: "unverified_personal_authorship", severity: "critical" });
    }
    if (!entry.author_name?.trim()) {
      issues.push({ code: "missing_author", severity: "critical" });
    }
  }
  return issues;
}

function severity(issues) {
  for (const level of ["critical", "high", "medium", "low"]) {
    if (issues.some((issue) => issue.severity === level)) return level;
  }
  return "none";
}

const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "content/knowledge-base/_index/manifest.json"), "utf8"),
);
const sourcePathById = new Map(manifest.entities.map((entry) => [entry.id, entry.path]));
const rawEntryById = new Map(raw.entities.map((entry) => [entry.id, entry]));
const issuesById = new Map(raw.entities.map((entry) => [entry.id, issuesFor(entry)]));

// Архивный URL допустим только если он одним переходом ведёт на материал,
// который реально проходит публичный gate. Иначе «безопасная консолидация»
// незаметно превращается в redirect chain или конечный 404.
for (const entry of raw.entities) {
  if (entry.status !== "archived") continue;
  const redirectTo = typeof entry.redirect_to === "string" ? entry.redirect_to.trim() : "";
  const target = rawEntryById.get(redirectTo);
  const archiveIssues = issuesById.get(entry.id) ?? [];
  if (!redirectTo || redirectTo === entry.id || !target) {
    archiveIssues.push({ code: "invalid_archive_redirect", severity: "critical" });
  } else if (target.status !== "published") {
    archiveIssues.push({ code: "archive_redirect_chain", severity: "critical", target: redirectTo });
  } else {
    const targetIssues = issuesById.get(redirectTo) ?? [];
    if (
      target.site_ready === false ||
      targetIssues.some((issue) => ["critical", "high"].includes(issue.severity))
    ) {
      archiveIssues.push({
        code: "archive_redirect_target_quarantined",
        severity: "critical",
        target: redirectTo,
      });
    }
  }
  issuesById.set(entry.id, archiveIssues);
}

const entries = raw.entities.map((entry) => {
  const issues = issuesById.get(entry.id) ?? [];
  const quarantined = issues.some((issue) => ["critical", "high"].includes(issue.severity));
  return {
    id: entry.id,
    route: `/baza-znaniy/${entry.id}`,
    locale: "ru",
    entityType: entry.type,
    sourceType: entry.media?.hero?.source_page?.includes("argentina.travel") ? "inprotur" : "knowledge-base",
    sourcePath: `content/knowledge-base/${sourcePathById.get(entry.id) ?? "not_recorded"}`,
    sourceUrl: entry.media?.hero?.source_page ?? null,
    title: entry.title,
    summary: entry.summary,
    publicationStatus: quarantined ? "quarantined" : entry.status,
    indexable: entry.status === "published" && !quarantined && entry.site_ready !== false,
    languageDetected: { title: language(entry.title), summary: language(entry.summary) },
    regionId: entry.region_id ?? null,
    province: entry.province ?? null,
    coordinates: entry.coordinates ?? null,
    canonicalEntityId: entry.site_id_map ?? entry.id,
    duplicateGroup: null,
    sourceCount: entry.editorial?.source_count ?? 0,
    verifiedAt: entry.last_verified ?? null,
    severity: severity(issues),
    issues,
  };
});

const counts = entries.reduce((acc, entry) => {
  acc.total += 1;
  acc[entry.severity] = (acc[entry.severity] ?? 0) + 1;
  if (!entry.indexable) acc.notIndexable += 1;
  return acc;
}, { total: 0, critical: 0, high: 0, medium: 0, low: 0, none: 0, notIndexable: 0 });

const audit = { generatedAt: new Date().toISOString(), scope: "knowledge-base", counts, entries };
const actions = entries.filter((entry) => entry.issues.length).map((entry) => ({
  id: entry.id,
  sourcePath: entry.sourcePath,
  action: ["critical", "high"].includes(entry.severity) ? "quarantine_and_review" : "editorial_review",
  reversible: true,
  issues: entry.issues.map((issue) => issue.code),
}));
const fixManifest = { generatedAt: audit.generatedAt, policy: "No source deletion; quarantine is reversible", actions };

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
fs.writeFileSync(fixPath, `${JSON.stringify(fixManifest, null, 2)}\n`);

const issueCounts = {};
for (const entry of entries) for (const issue of entry.issues) issueCounts[issue.code] = (issueCounts[issue.code] ?? 0) + 1;
const report = [
  "# Контент-аудит — 14 июля 2026",
  "",
  `Сформирован: ${audit.generatedAt}`,
  "",
  "## Исходное состояние",
  "",
  `- Проверено сущностей базы знаний: **${counts.total}**.`,
  `- Критических: **${counts.critical}**; высокий приоритет: **${counts.high}**; средний: **${counts.medium}**.`,
  `- Не допускаются в публичные индексы: **${counts.notIndexable}**.`,
  "- Исходные Markdown-файлы не удаляются; карантин обратим и описан в `var/ops/content-fix-manifest.json`.",
  "",
  "## Классы проблем",
  "",
  ...Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).map(([code, count]) => `- \`${code}\`: ${count}`),
  "",
  "## Критические материалы",
  "",
  ...entries.filter((entry) => entry.severity === "critical").slice(0, 100).map((entry) => `- \`${entry.id}\` — ${entry.title}; ${entry.issues.map((issue) => issue.code).join(", ")}`),
  "",
  "Полный реестр по каждой сущности находится в `var/ops/content-audit.json`.",
  "",
].join("\n");
fs.writeFileSync(reportPath, report);
console.log(JSON.stringify(counts, null, 2));

const publicBlockers = entries.filter(
  (entry) => entry.indexable && ["critical", "high"].includes(entry.severity)
);
const archiveRedirectBlockers = entries.filter((entry) =>
  entry.issues.some((issue) => issue.code.startsWith("archive_redirect") || issue.code === "invalid_archive_redirect"),
);
if (
  process.argv.includes("--strict") &&
  (publicBlockers.length > 0 || archiveRedirectBlockers.length > 0)
) {
  process.exitCode = 1;
}
