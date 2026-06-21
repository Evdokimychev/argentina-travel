#!/usr/bin/env node
/**
 * Scan src/ for image URLs (unsplash, wikimedia, http).
 * Count duplicates and write docs/image-audit-report.md with recommendations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "src");
const reportPath = path.join(root, "docs/image-audit-report.md");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");

const URL_PATTERN =
  /https?:\/\/(?:images\.unsplash\.com\/[^\s"'`<>]+|[^\s"'`<>]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"'`<>]*)?|upload\.wikimedia\.org\/[^\s"'`<>]+|commons\.wikimedia\.org\/[^\s"'`<>]+)/gi;

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx", ".css"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function classifyUrl(url) {
  if (url.includes("images.unsplash.com")) return "unsplash";
  if (url.includes("upload.wikimedia.org") || url.includes("commons.wikimedia.org")) return "wikimedia";
  if (url.startsWith("/media/")) return "local-media";
  return "external";
}

function classifyRecommendation(url, count, inManifest) {
  const kind = classifyUrl(url);
  if (kind === "local-media") return "KEEP";
  if (inManifest) return "KEEP";
  if (kind === "wikimedia" && count === 1) return "IMPROVE";
  if (kind === "wikimedia" && count > 1) return "REPLACE";
  if (kind === "unsplash") return count > 1 ? "REPLACE" : "IMPROVE";
  if (kind === "external") return "REVIEW";
  return "KEEP";
}

function loadManifestUrls() {
  if (!fs.existsSync(manifestPath)) return new Set();
  const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const assets = data.assets ?? data;
  const urls = new Set();
  for (const asset of assets) {
    if (asset.sourceUrl) urls.add(asset.sourceUrl);
    if (asset.localPath) urls.add(`/media/${asset.localPath.replace(/^\/+/, "")}`);
  }
  return urls;
}

function relativePath(file) {
  return path.relative(root, file);
}

function main() {
  const manifestUrls = loadManifestUrls();
  const urlMap = new Map();
  const fileMap = new Map();

  for (const file of walk(srcRoot)) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(URL_PATTERN) ?? [];
    for (const raw of matches) {
      const url = raw.replace(/[),.;]+$/, "");
      if (!urlMap.has(url)) urlMap.set(url, new Set());
      urlMap.get(url).add(relativePath(file));
    }
  }

  const duplicates = [...urlMap.entries()].filter(([, files]) => files.size > 1 || [...urlMap.values()].filter((s) => s.has([...files][0])).length);
  const duplicateUrls = [...urlMap.entries()].filter(([, files]) => {
    const count = [...urlMap.keys()].filter((u) => u === [...urlMap.keys()].find((k) => k === u)).length;
    return files.size > 1;
  });

  const byUrlCount = [...urlMap.entries()].map(([url, files]) => ({
    url,
    count: files.size,
    files: [...files],
    kind: classifyUrl(url),
    inManifest: manifestUrls.has(url),
    recommendation: classifyRecommendation(url, files.size, manifestUrls.has(url)),
  }));

  byUrlCount.sort((a, b) => b.count - a.count || a.url.localeCompare(b.url));

  const stats = {
    totalUrls: urlMap.size,
    totalReferences: byUrlCount.reduce((s, e) => s + e.count, 0),
    unsplash: byUrlCount.filter((e) => e.kind === "unsplash").length,
    wikimedia: byUrlCount.filter((e) => e.kind === "wikimedia").length,
    localMedia: byUrlCount.filter((e) => e.kind === "local-media").length,
    external: byUrlCount.filter((e) => e.kind === "external").length,
    duplicates: byUrlCount.filter((e) => e.count > 1).length,
    keep: byUrlCount.filter((e) => e.recommendation === "KEEP").length,
    replace: byUrlCount.filter((e) => e.recommendation === "REPLACE").length,
    improve: byUrlCount.filter((e) => e.recommendation === "IMPROVE").length,
    add: byUrlCount.filter((e) => e.recommendation === "ADD").length,
  };

  const duplicateGroups = byUrlCount.filter((e) => e.count > 1);

  const lines = [
    "# Image audit report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Unique image URLs | ${stats.totalUrls} |`,
    `| Total references | ${stats.totalReferences} |`,
    `| Unsplash | ${stats.unsplash} |`,
    `| Wikimedia | ${stats.wikimedia} |`,
    `| Local /media | ${stats.localMedia} |`,
    `| Other external | ${stats.external} |`,
    `| Duplicate URL groups | ${stats.duplicates} |`,
    "",
    "## Recommendations",
    "",
    "| Action | URLs |",
    "| --- | ---: |",
    `| KEEP | ${stats.keep} |`,
    `| REPLACE (duplicate or stock) | ${stats.replace} |`,
    `| IMPROVE (migrate to media library) | ${stats.improve} |`,
    `| ADD (missing local asset) | ${stats.add} |`,
    "",
  ];

  if (duplicateGroups.length > 0) {
    lines.push("## Duplicate URLs", "");
    for (const entry of duplicateGroups.slice(0, 40)) {
      lines.push(`### \`${entry.url.slice(0, 100)}${entry.url.length > 100 ? "…" : ""}\` (${entry.count} files)`, "");
      lines.push(`- **Recommendation:** ${entry.recommendation}`);
      lines.push(`- **Type:** ${entry.kind}`);
      for (const f of entry.files) lines.push(`- ${f}`);
      lines.push("");
    }
  }

  const unsplashRemaining = byUrlCount.filter((e) => e.kind === "unsplash");
  if (unsplashRemaining.length > 0) {
    lines.push("## Remaining Unsplash URLs", "");
    lines.push("Migrate these to `src/data/media-library/manifest.json` and `media-resolver`.", "");
    for (const entry of unsplashRemaining.slice(0, 30)) {
      lines.push(`- **${entry.recommendation}** \`${entry.url.slice(0, 90)}…\` (${entry.count} refs)`);
    }
    lines.push("");
  }

  lines.push("## All URLs by recommendation", "");
  for (const action of ["KEEP", "REPLACE", "IMPROVE", "ADD", "REVIEW"]) {
    const group = byUrlCount.filter((e) => e.recommendation === action);
    if (group.length === 0) continue;
    lines.push(`### ${action} (${group.length})`, "");
    for (const entry of group.slice(0, 25)) {
      lines.push(`- \`${entry.url.slice(0, 120)}\`${entry.url.length > 120 ? "…" : ""} — ${entry.count} file(s), ${entry.kind}`);
    }
    if (group.length > 25) lines.push(`- … and ${group.length - 25} more`);
    lines.push("");
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${reportPath}`);
  console.log(`Unique URLs: ${stats.totalUrls}, duplicates: ${stats.duplicates}, unsplash: ${stats.unsplash}`);
}

main();
