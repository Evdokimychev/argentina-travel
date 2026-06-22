#!/usr/bin/env node
/**
 * Summarize Next.js client chunk sizes after production build.
 * Writes docs/bundle-report.md
 *
 * Usage: npm run build && npm run bundle:report
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const chunksDir = path.join(root, ".next/static/chunks");
const reportPath = path.join(root, "docs/bundle-report.md");

const MAPLIBRE_BUDGET_KB = 450;
const PUBLIC_LAYOUT_BUDGET_KB = 10 * 1024;
/** Pre–Sprint 10 total client JS baseline (2026-06-21). */
const SPRINT10_BASELINE_TOTAL_KB = 12044.6;
const SPRINT10_TRIM_TARGET_RATIO = 0.85;

const PRIVATE_ROUTE_PATTERN =
  /\/app\/(?:organizer|admin|profile|api|embed\/organizer)(?:\/|$)/i;

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = walkFiles(chunksDir);
if (files.length === 0) {
  console.error("No .next/static/chunks/*.js — run npm run build first.");
  process.exit(1);
}

const rows = files
  .map((file) => ({
    file: path.relative(root, file),
    bytes: fs.statSync(file).size,
  }))
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
const publicRows = rows.filter((row) => !PRIVATE_ROUTE_PATTERN.test(row.file));
const publicBytes = publicRows.reduce((sum, row) => sum + row.bytes, 0);
const layoutRows = rows.filter((row) => /\/app\/layout-/.test(row.file));
const layoutBytes = layoutRows.reduce((sum, row) => sum + row.bytes, 0);
const maplibreRows = rows.filter((row) => /maplibre|mapbox|gl-js/i.test(row.file));
const maplibreBytes = maplibreRows.reduce((sum, row) => sum + row.bytes, 0);
const organizerRows = rows.filter((row) => /\/app\/organizer\//.test(row.file));
const organizerBytes = organizerRows.reduce((sum, row) => sum + row.bytes, 0);

const publicKb = publicBytes / 1024;
const trimTargetKb = SPRINT10_BASELINE_TOTAL_KB * SPRINT10_TRIM_TARGET_RATIO;
const trimDeltaPct = ((publicKb - SPRINT10_BASELINE_TOTAL_KB) / SPRINT10_BASELINE_TOTAL_KB) * 100;
const trimPass = publicKb <= trimTargetKb;

const lines = [
  "# Bundle report",
  "",
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  "",
  "## Summary",
  "",
  `- Client JS chunks: **${rows.length}** files, **${formatKb(totalBytes)}** total`,
  `- Public-surface chunks (excl. organizer/admin/profile/api): **${publicRows.length}** files, **${formatKb(publicBytes)}**`,
  `- Root layout chunk(s): **${formatKb(layoutBytes)}** (${layoutRows.length} file(s))`,
  `- Organizer route chunks: **${formatKb(organizerBytes)}** (not in public layout)`,
  `- MapLibre-related chunks: **${formatKb(maplibreBytes)}** (budget ≤ ${MAPLIBRE_BUDGET_KB} KB)`,
  `- MapLibre budget: ${maplibreBytes / 1024 <= MAPLIBRE_BUDGET_KB ? "✅ pass" : "⚠️ over budget"}`,
  `- Public layout budget (≤ ${PUBLIC_LAYOUT_BUDGET_KB} KB): ${publicKb <= PUBLIC_LAYOUT_BUDGET_KB ? "✅ pass" : "⚠️ over budget"}`,
  "",
  "## Sprint 10 trim (vs baseline)",
  "",
  `- Baseline total client JS: **${SPRINT10_BASELINE_TOTAL_KB.toFixed(1)} KB**`,
  `- Target (−15 %): **${trimTargetKb.toFixed(1)} KB** public-surface total`,
  `- Current public-surface: **${publicKb.toFixed(1)} KB** (${trimDeltaPct >= 0 ? "+" : ""}${trimDeltaPct.toFixed(1)} % vs baseline)`,
  `- Trim target: ${trimPass ? "✅ pass" : "⚠️ manual follow-up — run ANALYZE=true npm run build"}`,
  "",
  "## Top 20 client chunks",
  "",
  "| Size | File |",
  "|------|------|",
  ...rows.slice(0, 20).map((row) => `| ${formatKb(row.bytes)} | \`${row.file}\` |`),
  "",
  "## Commands",
  "",
  "```bash",
  "npm run build",
  "npm run bundle:report",
  "ANALYZE=true npm run build   # interactive @next/bundle-analyzer",
  "```",
  "",
];

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, lines.join("\n"));
console.log(`Wrote ${path.relative(root, reportPath)}`);
console.log(
  `Total: ${formatKb(totalBytes)}; Public: ${formatKb(publicBytes)}; MapLibre: ${formatKb(maplibreBytes)}`,
);

process.exit(maplibreBytes / 1024 > MAPLIBRE_BUDGET_KB ? 1 : 0);
