#!/usr/bin/env node
/**
 * Iteration 2 public route family matrix.
 * Classifies app page templates; does not invent live HTTP proof for every slug.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "src/app");

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === "page.tsx") acc.push(full);
  }
  return acc;
}

function toPattern(file) {
  const rel = path.relative(APP, path.dirname(file));
  if (!rel || rel === ".") return "/";
  const parts = rel.split(path.sep).filter((seg) => !/^\(.+\)$/.test(seg));
  return `/${parts.join("/")}`;
}

function classify(pattern) {
  if (
    pattern.startsWith("/admin") ||
    pattern.startsWith("/organizer") ||
    pattern.startsWith("/profile") ||
    pattern.startsWith("/dev") ||
    pattern.startsWith("/embed")
  ) {
    return "CORE_NON_INDEXABLE";
  }
  if (pattern.startsWith("/auth") || pattern.startsWith("/booking") || pattern.startsWith("/trip")) {
    return "CORE_NON_INDEXABLE";
  }
  if (pattern.startsWith("/shop") || pattern.startsWith("/forum")) return "DORMANT";
  if (pattern.startsWith("/car-rental") || pattern.startsWith("/transfers")) return "DORMANT";
  if (pattern.startsWith("/apartments")) return "POST_LAUNCH";
  if (pattern === "/maintenance" || pattern.startsWith("/yandex-verification")) {
    return "CORE_NON_INDEXABLE";
  }
  if (pattern === "/baza-znaniy/poisk") return "CORE_NON_INDEXABLE";
  if (pattern.startsWith("/map") && pattern !== "/mapa-argentina") return "LEGACY_REDIRECT";
  return "CORE_INDEXABLE";
}

const files = walk(APP);
const rows = files
  .map((file) => {
    const pattern = toPattern(file);
    return {
      pattern,
      source: path.relative(ROOT, file),
      class: classify(pattern),
    };
  })
  .sort((a, b) => a.pattern.localeCompare(b.pattern));

const outDir = path.join(ROOT, "docs/project-governance/iteration2-public-product");
fs.mkdirSync(outDir, { recursive: true });

const csv = [
  "route_pattern,class,source_file",
  ...rows.map((row) => `${row.pattern},${row.class},${row.source}`),
  "",
].join("\n");
fs.writeFileSync(path.join(outDir, "PUBLIC_ROUTE_MATRIX.csv"), csv);

const counts = rows.reduce((acc, row) => {
  acc[row.class] = (acc[row.class] ?? 0) + 1;
  return acc;
}, {});

const summary = {
  generatedAt: new Date().toISOString(),
  pageTemplates: rows.length,
  counts,
};
fs.writeFileSync(
  path.join(outDir, "PUBLIC_ROUTE_MATRIX.summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log(`wrote ${rows.length} page templates`, counts);
