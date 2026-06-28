#!/usr/bin/env node
/**
 * Local development audit orchestrator.
 * Usage: node scripts/audit.mjs [--quick|--security|--perf|--full]
 */
import { spawnSync } from "node:child_process";

const mode = process.argv[2]?.replace(/^--/, "") || "full";

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
  run("Unit tests", "npm", ["test"]);
};

const security = () => {
  run("RLS audit", "node", ["scripts/rls-audit.mjs"]);
  run("Secret patterns scan", "node", ["scripts/audit-secrets.mjs"]);
};

const perf = () => {
  run("Bundle report", "npm", ["run", "bundle:report"]);
  console.log("\nℹ Lighthouse: npm run lighthouse:blog (requires dev server)");
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
