import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs/content-overhaul");
const outputPath = path.join(root, "var/ops/content-governance-audit.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers = [], ...values] = rows.filter((candidate) => candidate.some(Boolean));
  return values.map((candidate) =>
    Object.fromEntries(headers.map((header, index) => [header, candidate[index] ?? ""]))
  );
}

function readCsv(filename) {
  const filePath = path.join(docsDir, filename);
  if (!fs.existsSync(filePath)) throw new Error(`Missing governance artifact: ${filename}`);
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function duplicateIds(rows, key = "id") {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    if (!row[key]) continue;
    if (seen.has(row[key])) duplicates.add(row[key]);
    seen.add(row[key]);
  }
  return [...duplicates];
}

const sources = readCsv("source-registry.csv");
const claims = readCsv("claim-registry.csv");
const sensitiveClaims = readCsv("sensitive-claims.csv");
const mediaRights = readCsv("media-rights-register.csv");
const missingMedia = readCsv("missing-media.csv");
const dynamicFacts = readCsv("dynamic-facts-register.csv");
const widgets = readCsv("widget-registry.csv");
const links = readCsv("broken-links.csv");
const inventory = readCsv("content-inventory.csv");
const actions = readCsv("content-action-plan.csv");

const sourceIds = new Set(sources.map((source) => source.id));
const unknownClaimSources = claims.flatMap((claim) =>
  (claim.source_ids || "")
    .split("|")
    .filter(Boolean)
    .filter((sourceId) => !sourceIds.has(sourceId))
    .map((sourceId) => ({ claimId: claim.id, sourceId }))
);

const structuralErrors = [
  ...duplicateIds(sources).map((id) => `duplicate source id: ${id}`),
  ...duplicateIds(claims).map((id) => `duplicate claim id: ${id}`),
  ...duplicateIds(widgets).map((id) => `duplicate widget id: ${id}`),
  ...duplicateIds(inventory).map((id) => `duplicate content id: ${id}`),
  ...unknownClaimSources.map(({ claimId, sourceId }) =>
    `claim ${claimId} references unknown source ${sourceId}`
  ),
];

const report = {
  generatedAt: new Date().toISOString(),
  ok: structuralErrors.length === 0,
  structuralErrors,
  counts: {
    inventory: inventory.length,
    actions: actions.length,
    sources: sources.length,
    activeHttpsSources: sources.filter(
      (source) => source.status === "active" && source.url.startsWith("https://")
    ).length,
    sourcesNeedingReview: sources.filter((source) => source.status !== "active").length,
    claims: claims.length,
    sensitiveClaims: sensitiveClaims.length,
    verifiedClaims: claims.filter((claim) => claim.status === "verified").length,
    claimsNeedingReview: claims.filter((claim) => claim.status !== "verified").length,
    mediaRightsRecords: mediaRights.length,
    verifiedMediaRights: mediaRights.filter((item) => item.rights_status === "verified").length,
    missingMedia: missingMedia.length,
    dynamicFacts: dynamicFacts.length,
    activeWidgets: widgets.filter((widget) => widget.status === "active").length,
    widgets: widgets.length,
    unresolvedLinks: links.filter((link) => !["resolved", "ok"].includes(link.status)).length,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.ok) process.exitCode = 1;
if (
  process.argv.includes("--strict") &&
  (report.counts.claimsNeedingReview > 0 ||
    report.counts.sourcesNeedingReview > 0 ||
    report.counts.unresolvedLinks > 0)
) {
  process.exitCode = 1;
}
