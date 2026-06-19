#!/usr/bin/env node
/**
 * Idempotent CMS seed from static TS content files.
 * Usage: npm run supabase:seed-cms
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found. Copy .env.example and fill in values.");
  }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  }

  const publish = !process.argv.includes("--draft");
  const force = process.argv.includes("--force");
  const i18nStubs = process.argv.includes("--i18n-stubs");
  const docTypeArg = process.argv.find((arg) => arg.startsWith("--type="));
  const docTypes = docTypeArg
    ? docTypeArg
        .slice("--type=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;

  const { createSupabaseAdminClient } = await import(
    pathToFileURL(path.join(root, "src/lib/supabase/admin.ts")).href
  );
  const { seedCmsFromTs, buildCmsSeedEntries, seedCmsI18nEmptyStubs } = await import(
    pathToFileURL(path.join(root, "src/lib/cms/cms-ts-seed.ts")).href
  );

  const supabase = createSupabaseAdminClient();
  const preview = buildCmsSeedEntries();
  console.log(`Импорт ${preview.length} документов из TS (${docTypes?.join(", ") ?? "все типы"})…`);

  const result = await seedCmsFromTs(supabase, {
    docTypes,
    publish,
    skipExisting: !force,
  });

  console.log(
    `Готово: создано ${result.created}, пропущено ${result.skipped}, обновлено ${result.updated} из ${result.total}`
  );

  if (i18nStubs) {
    console.log("Создание es/en черновиков-заготовок для top-10 slugs…");
    const stubResult = await seedCmsI18nEmptyStubs(supabase, { skipExisting: !force });
    console.log(
      `Заготовки: создано ${stubResult.created}, пропущено ${stubResult.skipped}, обновлено ${stubResult.updated} из ${stubResult.total}`
    );
    if (stubResult.errors.length) {
      console.error("Ошибки заготовок:", stubResult.errors);
      process.exit(1);
    }
  }

  if (result.errors.length) {
    console.error("Ошибки:", result.errors);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
