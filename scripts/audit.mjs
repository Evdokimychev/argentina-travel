#!/usr/bin/env node
/**
 * Local development audit orchestrator.
 * Usage: node scripts/audit.mjs [--quick|--security|--perf|--full]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2]?.replace(/^--/, "") || "full";
const root = process.cwd();

const run = (label, cmd, args = [], opts = {}) => {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) {
    console.error(`✗ Failed: ${label}`);
    process.exit(r.status ?? 1);
  }
  console.log(`✓ ${label}`);
};

const quick = () => {
  run("TypeScript", "npx", ["tsc", "--noEmit"]);
  run("ESLint", "npm", ["run", "lint"]);
  run("Product surface inventory", "npm", ["run", "inventory:check"]);
  run("Unit tests", "npm", ["test"]);
  run("Release evidence contracts", "node", [
    "--test",
    "scripts/lib/commercial-catalog-smoke.test.mjs",
    "scripts/lib/database-backup.test.mjs",
    "scripts/lib/database-target-attestation.test.mjs",
    "scripts/lib/direct-postgres-tools-contract.test.mjs",
    "scripts/lib/migration-journal.test.mjs",
    "scripts/lib/ops-report-evidence.test.mjs",
  ]);
};

const security = () => {
  run("Dependency audit policy", "npm", ["run", "audit:deps:policy"]);
  run("RLS audit", "node", ["scripts/rls-audit.mjs"]);
  run("Secret patterns scan", "node", ["scripts/audit-secrets.mjs"]);
};

const perf = () => {
  run("Bundle report", "npm", ["run", "bundle:report"]);
  run("GTM events audit", "node", ["scripts/gtm-events-audit.mjs"]);
  const hasBuild = fs.existsSync(path.join(root, ".next/BUILD_ID"));
  const hasExternalBase = Boolean(process.env.LIGHTHOUSE_BASE_URL?.trim());
  if (!hasBuild && !hasExternalBase) {
    console.log("\nℹ Skip Lighthouse — npm run build && npm run lighthouse:phase2 (or lighthouse:phase2:prod)");
    return;
  }
  run("Lighthouse phase2", "node", ["scripts/lighthouse-phase2-ci.mjs"]);
};

const full = () => {
  quick();
  security();
  run("Supabase verify", "npm", ["run", "supabase:verify"]);
  run("Migration meta", "node", ["scripts/write-migration-meta.mjs"]);
  run("Project readiness", "npm", ["run", "project:readiness"]);
  console.log("\n✓ Full audit complete");
};

switch (mode) {
  case "quick":
    quick();
    break;
  case "security":
    security();
    break;
  case "perf":
    perf();
    break;
  case "full":
  default:
    full();
    break;
}
