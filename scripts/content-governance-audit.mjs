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

const publicEntryIds = new Set(
  inventory.filter((entry) => entry.status === "published_public").map((entry) => entry.id)
);
const publicSources = sources.filter((source) => publicEntryIds.has(source.entry_id));
const publicClaims = claims.filter((claim) => publicEntryIds.has(claim.entry_id));
const publicSensitiveClaims = publicClaims.filter((claim) => claim.sensitive === "yes");
const publicSensitiveEntries = sensitiveClaims.filter((entry) => entry.public === "yes");
const sourceKeys = new Set(sources.map((source) => `${source.entry_id}:${source.source_id}`));
const unknownClaimSources = claims.flatMap((claim) =>
  (claim.item_source_id || "")
    .split(/[;|]/)
    .filter((sourceId) => sourceId && sourceId !== "not_recorded")
    .filter((sourceId) => !sourceKeys.has(`${claim.entry_id}:${sourceId}`))
    .map((sourceId) => ({ claimId: claim.claim_id, sourceId }))
);

const sourceKeysForDuplicateCheck = sources.map((source) => ({
  id: `${source.entry_id}:${source.source_id}`,
}));
const claimKeysForDuplicateCheck = claims.map((claim) => ({
  id: `${claim.entry_id}:${claim.claim_id}`,
}));

const structuralErrors = [
  ...duplicateIds(sourceKeysForDuplicateCheck).map((id) => `duplicate entry/source id: ${id}`),
  ...duplicateIds(claimKeysForDuplicateCheck).map((id) => `duplicate entry/claim id: ${id}`),
  ...duplicateIds(widgets, "widget_id").map((id) => `duplicate widget id: ${id}`),
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
    sources: publicSources.length,
    activeHttpsSources: sources.filter(
      (source) =>
        publicEntryIds.has(source.entry_id) &&
        ["verified", "recorded_article_level"].includes(source.status) &&
        source.source_url.startsWith("https://")
    ).length,
    sourcesNeedingReview: publicSources.filter((source) => source.status === "review_required").length,
    claims: publicClaims.length,
    sensitiveClaims: publicSensitiveEntries.length,
    verifiedClaims: publicSensitiveClaims.filter((claim) => claim.review_status === "verified").length,
    claimsNeedingReview: publicSensitiveClaims.filter((claim) => claim.review_status !== "verified").length,
    mediaRightsRecords: mediaRights.length,
    verifiedMediaRights: mediaRights.filter((item) => item.rights_status === "verified").length,
    missingMedia: missingMedia.length,
    dynamicFacts: dynamicFacts.length,
    activeWidgets: widgets.filter((widget) => ["active", "implemented"].includes(widget.status)).length,
    widgets: widgets.length,
    unresolvedLinks: links.filter((link) =>
      !["resolved", "ok", "closed_no_broken_links", "verified_no_public_breakage"].includes(link.status)
    ).length,
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
    publicSensitiveEntries.some((entry) => entry.status !== "strict_ready") ||
    report.counts.unresolvedLinks > 0)
) {
  process.exitCode = 1;
}
