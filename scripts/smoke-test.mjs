#!/usr/bin/env node
/**
 * Combined smoke runner.
 * Executes:
 *  - scripts/smoke-admin.mjs
 *  - scripts/smoke-public.mjs
 */
import { spawnSync } from "node:child_process";

const checks = [
  { label: "admin", args: ["scripts/smoke-admin.mjs"] },
  { label: "public", args: ["scripts/smoke-public.mjs"] },
];

for (const check of checks) {
  console.log(`\nRunning ${check.label} smoke checks...`);
  const result = spawnSync(process.execPath, check.args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll smoke checks passed.");
