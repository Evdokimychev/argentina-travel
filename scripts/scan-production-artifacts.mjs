#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const distDir =
  process.env.NEXT_DIST_DIR?.trim() ||
  (process.env.CI || process.env.VERCEL ? ".next" : ".next-production");
const buildRoot = path.resolve(distDir);
const roots = ["static", "server"].map((item) => path.join(buildRoot, item));
const forbidden = [
  /https?:\/\/(?:localhost|127\.0\.0\.1):300[0-3](?:\/|["'`])/i,
  /argentina-travel-auth-users/i,
  /demo123/i,
];
const findings = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(target);
      continue;
    }
    if (!/\.(?:js|json|html|txt)$/.test(entry.name)) continue;
    const source = fs.readFileSync(target, "utf8");
    for (const marker of forbidden) {
      if (marker.test(source)) findings.push(`${path.relative(process.cwd(), target)}: ${marker}`);
    }
  }
}

if (!fs.existsSync(path.join(buildRoot, "BUILD_ID"))) {
  console.error(`Production build not found in ${distDir}; run npm run build first`);
  process.exit(1);
}

for (const root of roots) walk(root);
if (findings.length > 0) {
  console.error(`Forbidden production artifact markers:\n${findings.slice(0, 50).join("\n")}`);
  process.exit(1);
}
console.log("Production artifacts contain no localhost or demo authentication markers");
