#!/usr/bin/env node
/**
 * Summarize Next.js client chunk sizes after production build.
 * Writes docs/bundle-report.md by default. CI can keep generated evidence in
 * var/ops by setting BUNDLE_REPORT_FILE=var/ops/bundle-report.md.
 *
 * Usage: npm run build && npm run bundle:report
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const chunksDir = path.join(root, ".next/static/chunks");
const reportPath = path.join(
  root,
  process.env.BUNDLE_REPORT_FILE?.trim() || "docs/bundle-report.md",
);

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

/** Representative public routes for first-load JS accounting (Sprint 4). */
const ROUTE_FIRST_LOAD_PROBE = [
  "/",
  "/tours",
  "/blog",
  "/destinations/patagonia",
  "/baza-znaniy",
  "/mapa-argentina",
];

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function collectRouteFirstLoadJs() {
  const buildManifest = readJsonSafe(path.join(root, ".next/app-build-manifest.json"));
  const staticDir = path.join(root, ".next/static");
  if (!buildManifest?.pages || !fs.existsSync(staticDir)) return [];

  const pageMap = buildManifest.pages;
  return ROUTE_FIRST_LOAD_PROBE.map((route) => {
    const keys = Object.keys(pageMap).filter(
      (key) => key === route || key === `${route}/page` || key.endsWith(`${route}/page`),
    );
    const files = new Set();
    for (const key of keys) {
      for (const file of pageMap[key] ?? []) {
        if (typeof file === "string" && file.endsWith(".js")) files.add(file.replace(/^\//, ""));
      }
    }
    // Shared root layout often listed under `/` — include for every route as shared baseline.
    for (const file of pageMap["/"] ?? []) {
      if (typeof file === "string" && file.endsWith(".js")) files.add(file.replace(/^\//, ""));
    }

    let bytes = 0;
    const resolved = [];
    for (const rel of files) {
      const abs = path.join(root, ".next", rel);
      const alt = path.join(staticDir, rel.replace(/^_next\/static\//, "").replace(/^static\//, ""));
      const candidate = fs.existsSync(abs) ? abs : fs.existsSync(alt) ? alt : null;
      if (!candidate) continue;
      const size = fs.statSync(candidate).size;
      bytes += size;
      resolved.push({ file: path.relative(root, candidate), bytes: size });
    }

    return {
      route,
      bytes,
      files: resolved.sort((a, b) => b.bytes - a.bytes).slice(0, 8),
    };
  });
}

const routeFirstLoad = collectRouteFirstLoadJs();

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
  "## Route first-load JS (evidence)",
  "",
  "Estimated from `.next/app-build-manifest.json` for representative public routes.",
  "This is **not** a weakened Lighthouse gate — script transfer floors stay in phase2 CI.",
  "",
  "| Route | First-load JS | Top chunks |",
  "|-------|---------------|------------|",
  ...(routeFirstLoad.length
    ? routeFirstLoad.map((entry) => {
        const top = entry.files
          .slice(0, 3)
          .map((file) => `${formatKb(file.bytes)} \`${file.file}\``)
          .join("; ");
        return `| \`${entry.route}\` | **${formatKb(entry.bytes)}** | ${top || "—"} |`;
      })
    : ["| _(unavailable)_ | build manifest missing | — |"]),
  "",
  `- MapLibre present only in map-related chunks: ${
    maplibreBytes === 0
      ? "none detected in walk (lazy/isolated or not built)"
      : formatKb(maplibreBytes)
  }`,
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
