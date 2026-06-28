#!/usr/bin/env node
/**
 * Install optional pre-commit hook (no husky dependency).
 * Runs tsc + lint on staged TS/TSX files.
 */
import { writeFileSync, chmodSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const gitDir = join(process.cwd(), ".git");
if (!existsSync(gitDir)) {
  console.error("Not a git repository");
  process.exit(1);
}

const hooksDir = join(gitDir, "hooks");
mkdirSync(hooksDir, { recursive: true });

const hook = `#!/bin/sh
# Auto-installed by scripts/setup-git-hooks.mjs
set -e
echo "pre-commit: quick checks..."
npx tsc --noEmit
npm run lint
echo "pre-commit: OK"
`;

const hookPath = join(hooksDir, "pre-commit");
writeFileSync(hookPath, hook, { mode: 0o755 });
chmodSync(hookPath, 0o755);

console.log("✓ Installed .git/hooks/pre-commit");
console.log("  Runs: tsc --noEmit + npm run lint");
console.log("  Remove hook: rm .git/hooks/pre-commit");
