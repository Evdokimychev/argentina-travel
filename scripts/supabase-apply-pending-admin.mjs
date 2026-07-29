#!/usr/bin/env node
/**
 * Retired unsafe migration runner.
 *
 * This legacy entry point applied selected SQL files without the canonical
 * migration journal, checksum verification, target-environment guard, or
 * production confirmation. Keep the filename as an explicit fail-closed
 * compatibility boundary; all migration work must use the journaled runner.
 */

console.error(
  "This unjournaled migration runner is disabled. Use `npm run supabase:migrate` with MIGRATION_TARGET_ENVIRONMENT and the required target confirmation.",
);
process.exitCode = 1;
