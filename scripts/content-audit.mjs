import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "content/knowledge-base/_index/manifest.json");
const outputPath = path.join(root, "var/ops/content-audit.json");
const fixPath = path.join(root, "var/ops/content-fix-manifest.json");
const reportPath = path.join(root, "docs/audit/content-audit-2026-07-14.md");
const MIXED_RE = /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/gu;
const PLACEHOLDER_RE = /\b(?:placeholder|lorem ipsum|todo|tbd|undefined|null)\b/i;

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
  const title = entry.title ?? "";
  const summary = entry.summary ?? "";
  const visible = `${title} ${summary}`;
  const titleScript = scripts(title);
  const summaryScript = scripts(summary);
  const mixedWords = visible.match(MIXED_RE) ?? [];
  if (entry.status === "published" && entry.site_ready === false) issues.push({ code: "not_publication_ready", severity: "critical" });
  if (mixedWords.length) issues.push({ code: "mixed_script_word", severity: "critical", values: mixedWords });
  if (titleScript.latin >= 4 && titleScript.ru === 0) issues.push({ code: "non_russian_title", severity: "critical" });
  if (summaryScript.latin >= 20 && summaryScript.latin > summaryScript.ru * 2) issues.push({ code: "non_russian_summary", severity: "critical" });
  if (PLACEHOLDER_RE.test(visible)) issues.push({ code: "placeholder_content", severity: "critical" });
  if (entry.editorial?.sensitive && entry.editorial?.missing_sources) issues.push({ code: "missing_sensitive_source", severity: "critical" });
  if (entry.status === "published" && (entry.editorial?.word_count ?? 0) < 120) issues.push({ code: "thin_content", severity: "high" });
  if (entry.site_ready && !entry.media?.hero && ["city", "national_park", "attraction", "region", "route"].includes(entry.type)) {
    issues.push({ code: "missing_hero", severity: "high" });
  }
  if (entry.editorial?.review_due) issues.push({ code: "verification_due", severity: "medium" });
  return issues;
}

function severity(issues) {
  for (const level of ["critical", "high", "medium", "low"]) {
    if (issues.some((issue) => issue.severity === level)) return level;
  }
  return "none";
}

const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const entries = raw.entities.map((entry) => {
  const issues = issuesFor(entry);
  const quarantined = issues.some((issue) => ["critical", "high"].includes(issue.severity));
  return {
    id: entry.id,
    route: `/baza-znaniy/${entry.id}`,
    locale: "ru",
    entityType: entry.type,
    sourceType: entry.media?.hero?.source_page?.includes("argentina.travel") ? "inprotur" : "knowledge-base",
    sourcePath: `content/knowledge-base/${entry.path}`,
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
if (process.argv.includes("--strict") && publicBlockers.length > 0) process.exitCode = 1;
