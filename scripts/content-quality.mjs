#!/usr/bin/env node
/**
 * Content OS quality orchestration (Sprint 3).
 * Does not reimplement gates — runs existing content/SEO/KB/media checks.
 *
 *   npm run content:quality
 *   npm run content:quality:strict
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const strict = process.argv.includes("--strict");
const outPath = path.join(root, "var/ops/content-quality-last.json");

/** @type {Array<{ id: string, command: string, args: string[], blocking: boolean }>} */
const checks = [
  { id: "ownership-contract-present", command: "node", args: ["-e", "require('fs').accessSync('docs/editorial/CONTENT_OWNERSHIP_CONTRACT.md')"], blocking: true },
  { id: "kb-manifest-stats", command: "node", args: ["scripts/kb-manifest-stats.mjs"], blocking: true },
  { id: "kb-quarantine-report", command: "node", args: ["scripts/kb-quarantine-report.mjs"], blocking: true },
  { id: "sync-rich-articles", command: "npm", args: ["run", "sync-rich-articles:check"], blocking: true },
  { id: "sync-manual-posts", command: "npm", args: ["run", "sync-manual-posts:check"], blocking: true },
  { id: "blog-editorial-readiness", command: "npm", args: ["run", "blog:editorial-readiness:check"], blocking: true },
  { id: "guide-editorial-readiness", command: "npm", args: ["run", "guide:editorial-readiness:check"], blocking: true },
  { id: "content-lint", command: "npm", args: ["run", "content:lint"], blocking: strict },
  { id: "content-governance", command: "npm", args: ["run", strict ? "content:governance:strict" : "content:governance"], blocking: strict },
  { id: "content-links", command: "npm", args: ["run", "content:links"], blocking: strict },
  { id: "kb-source-health", command: "npm", args: ["run", "kb:source-health:check"], blocking: strict },
  { id: "media-integrity", command: "npm", args: ["run", "media:integrity"], blocking: true },
  { id: "media-rights-changed", command: "npm", args: ["run", "media:rights:check"], blocking: true },
];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

const results = [];
let failedBlocking = false;

for (const check of checks) {
  console.log(`\n[content:quality] ${check.id}`);
  const result = run(check.command, check.args);
  const ok = result.status === 0;
  if (!ok && check.blocking) failedBlocking = true;
  results.push({
    id: check.id,
    ok,
    blocking: check.blocking,
    status: result.status,
  });
  if (!ok) {
    const tail = (result.stderr || result.stdout).split("\n").slice(-20).join("\n");
    console.error(tail);
  } else {
    console.log("  ok");
  }
}

const report = {
  at: new Date().toISOString(),
  strict,
  pass: !failedBlocking,
  results,
  ownershipContract: "docs/editorial/CONTENT_OWNERSHIP_CONTRACT.md",
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`\ncontent:quality pass=${report.pass} strict=${strict}`);
console.log(`Report: ${path.relative(root, outPath)}`);
process.exit(report.pass ? 0 : 1);
