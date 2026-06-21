import fs from "node:fs";
import path from "node:path";
import generatedMeta from "@/lib/ops/migration-meta.generated.json";

type MigrationMeta = {
  latestId: string | null;
  fileCount: number;
};

function readGeneratedMeta(): MigrationMeta {
  return {
    latestId: generatedMeta.latestId ?? null,
    fileCount: typeof generatedMeta.fileCount === "number" ? generatedMeta.fileCount : 0,
  };
}

function readFilesystemMeta(rootDir: string): MigrationMeta {
  const migrationsDir = path.join(rootDir, "supabase/migrations");
  if (!fs.existsSync(migrationsDir)) {
    return { latestId: null, fileCount: 0 };
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const latest = files.at(-1);
  return {
    latestId: latest ? latest.replace(/\.sql$/, "") : null,
    fileCount: files.length,
  };
}

function resolveMigrationMeta(rootDir = process.cwd()): MigrationMeta {
  const fromFs = readFilesystemMeta(rootDir);
  if (fromFs.fileCount > 0) return fromFs;
  return readGeneratedMeta();
}

export function getLatestMigrationId(rootDir = process.cwd()): string | null {
  return resolveMigrationMeta(rootDir).latestId;
}

export function getMigrationFileCount(rootDir = process.cwd()): number {
  return resolveMigrationMeta(rootDir).fileCount;
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
