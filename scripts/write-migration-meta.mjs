#!/usr/bin/env node
/**
 * Writes migration-meta.generated.json for runtime health checks on Vercel
 * (supabase/migrations is not bundled into serverless by default).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "supabase/migrations");
const outFile = path.join(root, "src/lib/ops/migration-meta.generated.json");

const files = fs.existsSync(migrationsDir)
  ? fs
      .readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .sort()
  : [];

const latestFile = files.at(-1) ?? null;
const payload = {
  latestId: latestFile ? latestFile.replace(/\.sql$/, "") : null,
  fileCount: files.length,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(
  `Migration meta: ${payload.fileCount} files, latest=${payload.latestId ?? "—"} → ${path.relative(root, outFile)}`
);
