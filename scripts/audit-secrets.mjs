#!/usr/bin/env node
/**
 * Scan tracked source for accidental secret patterns.
 * Exits 1 if suspicious patterns found in staged-like paths.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "var",
  "test-results",
  "playwright-report",
  ".git",
]);
const EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".env.example"]);

const PATTERNS = [
  { name: "AWS key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key block", re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: "Hardcoded bearer", re: /Bearer\s+[a-zA-Z0-9._-]{32,}/i },
  { name: "sk_live stripe", re: /sk_live_[a-zA-Z0-9]{20,}/ },
];

/** @param {string} dir */
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (EXT.has(extname(name)) && !name.endsWith(".example")) files.push(p);
  }
  return files;
}

const hits = [];
for (const file of walk(ROOT)) {
  if (file.includes(".env") && !file.endsWith(".env.example")) continue;
  const text = readFileSync(file, "utf8");
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) {
      // ignore obvious test fixtures / placeholders
      if (text.includes("REDACTED") || text.includes("your-key-here")) continue;
      hits.push({ file: file.replace(ROOT + "/", ""), name });
    }
  }
}

if (hits.length) {
  console.error("⚠ Potential secrets found:");
  for (const h of hits) console.error(`  - ${h.file}: ${h.name}`);
  process.exit(1);
}
console.log("✓ No obvious secret patterns in source");
