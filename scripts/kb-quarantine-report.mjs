#!/usr/bin/env node
/**
 * KB publication / quarantine report with structured reason codes.
 * Reads content.json + publication-quality gate (via tsx).
 *
 *   npm run kb:quarantine-report
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outJson = path.join(root, "var/ops/kb-quarantine-report-last.json");
const outMd = path.join(root, "docs/knowledge-base/QUARANTINE_REPORT.md");

const runner = `
import fs from "node:fs";
import path from "node:path";
import {
  getPublicationIssues,
  isPublicKbEntry,
} from "./src/lib/knowledge-base/publication-quality.ts";

const index = JSON.parse(
  fs.readFileSync("content/knowledge-base/_index/content.json", "utf8"),
);
const entities = index.entities ?? [];
const reasonCounts = {};
const samples = {};
let publicReady = 0;
let quarantined = 0;
let archived = 0;
let staleReview = 0;
let missingSources = 0;
let missingClaims = 0;
let sensitiveReviewDue = 0;

for (const entry of entities) {
  if (entry.status === "archived") {
    archived += 1;
    continue;
  }
  if (isPublicKbEntry(entry)) {
    publicReady += 1;
    continue;
  }
  quarantined += 1;
  const issues = getPublicationIssues(entry);
  for (const issue of issues) {
    reasonCounts[issue] = (reasonCounts[issue] ?? 0) + 1;
    if (!samples[issue]) samples[issue] = [];
    if (samples[issue].length < 8) samples[issue].push(entry.id);
  }
  if (issues.includes("verification_due")) staleReview += 1;
  if (issues.includes("missing_source") || issues.includes("missing_sensitive_source")) {
    missingSources += 1;
  }
  if (issues.includes("sensitive_provenance_not_ready")) missingClaims += 1;
  if (issues.includes("verification_due") || issues.includes("sensitive_provenance_not_ready")) {
    sensitiveReviewDue += 1;
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  total: entities.length,
  publicReady,
  quarantined,
  archived,
  backlog: entities.filter((e) => e.status === "backlog").length,
  staleReview,
  sensitiveReviewDue,
  missingSources,
  missingClaims,
  reasonCounts,
  samples,
};
console.log(JSON.stringify(report));
`;

const result = spawnSync("npx", ["tsx", "-e", runner], {
  cwd: root,
  encoding: "utf8",
  env: process.env,
  maxBuffer: 20 * 1024 * 1024,
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const report = JSON.parse(result.stdout.trim().split("\n").filter(Boolean).at(-1));
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);

const reasonRows = Object.entries(report.reasonCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([code, count]) => `| ${code} | ${count} | ${(report.samples[code] ?? []).join(", ")} |`)
  .join("\n");

const md = `# KB quarantine report (generated)

Generated: \`${report.generatedAt}\`

| Metric | Count |
|--------|------:|
| TOTAL | ${report.total} |
| PUBLIC READY | ${report.publicReady} |
| QUARANTINED (non-archived) | ${report.quarantined} |
| ARCHIVED | ${report.archived} |
| BACKLOG | ${report.backlog} |
| STALE / REVIEW DUE | ${report.staleReview} |
| SENSITIVE REVIEW DUE | ${report.sensitiveReviewDue} |
| MISSING SOURCES | ${report.missingSources} |
| MISSING CLAIMS / PROVENANCE | ${report.missingClaims} |

## Reason codes

| Code | Count | Sample ids |
|------|------:|------------|
${reasonRows || "| _(none)_ | 0 | |"}

Do not mass-publish quarantine. Rebuild: \`npm run kb:quarantine-report\`.
`;
fs.writeFileSync(outMd, md);

console.log(
  `KB TOTAL=${report.total} PUBLIC=${report.publicReady} QUARANTINED=${report.quarantined} ARCHIVED=${report.archived}`,
);
console.log(`Wrote ${path.relative(root, outJson)} and ${path.relative(root, outMd)}`);
