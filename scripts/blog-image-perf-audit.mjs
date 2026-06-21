#!/usr/bin/env node
/**
 * Blog image performance audit (S13): flags hotlinks and unoptimized next/image in blog views.
 *
 * Usage: node scripts/blog-image-perf-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const blogDir = path.join(root, "src/components/blog");

const HOTLINK_RE = /https?:\/\/(?:images\.unsplash\.com|upload\.wikimedia\.org)/;
const UNOPTIMIZED_RE = /\bunoptimized\b/;

/** @type {string[]} */
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
}

walk(blogDir);

/** @type {Array<{ file: string; issue: string; detail: string }>} */
const issues = [];

for (const file of files) {
  const rel = path.relative(root, file);
  const content = fs.readFileSync(file, "utf8");

  if (HOTLINK_RE.test(content)) {
    const match = content.match(HOTLINK_RE);
    issues.push({ file: rel, issue: "hotlink", detail: match?.[0] ?? "external URL" });
  }

  if (UNOPTIMIZED_RE.test(content)) {
    issues.push({ file: rel, issue: "unoptimized", detail: "unoptimized prop on Image" });
  }

  const imageTags = (content.match(/<Image\b[^>]*>/g) ?? []).concat(
    content.match(/<SafeImage\b[^>]*>/g) ?? [],
  );
  for (const tag of imageTags) {
    if (/\bfill\b/.test(tag) && !/\bsizes=/.test(tag)) {
      issues.push({ file: rel, issue: "missing-sizes", detail: tag.slice(0, 80) });
    }
  }
}

console.log(`Blog image perf audit — ${files.length} files in src/components/blog`);

if (issues.length === 0) {
  console.log("OK: 0 hotlinks, 0 unoptimized paths, all fill images have sizes.");
  process.exit(0);
}

for (const row of issues) {
  console.error(`[${row.issue}] ${row.file}: ${row.detail}`);
}
console.error(`\n${issues.length} issue(s) found.`);
process.exit(1);
