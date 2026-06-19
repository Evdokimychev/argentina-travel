import fs from "node:fs";
import path from "node:path";

export function getLatestMigrationId(rootDir = process.cwd()): string | null {
  const migrationsDir = path.join(rootDir, "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) return null;

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const latest = files.at(-1);
  return latest ? latest.replace(/\.sql$/, "") : null;
}

export function getMigrationFileCount(rootDir = process.cwd()): number {
  const migrationsDir = path.join(rootDir, "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) return 0;
  return fs.readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).length;
}

export function getMigrationIds(rootDir = process.cwd()): string[] {
  const migrationsDir = path.join(rootDir, "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) return [];

  return fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => name.replace(/\.sql$/, ""));
}
