#!/usr/bin/env node
/**
 * Archive CMS blog documents whose slugs were replaced (legacy English slugs).
 *
 * Usage:
 *   npm run cms:archive-orphan-blog-slugs
 *   npm run cms:archive-orphan-blog-slugs -- --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** Slugs removed from TS catalog; canonical replacements in content-plan-url-redirects. */
const ORPHAN_BLOG_SLUGS = [
  {
    slug: "buenos-aires-neighborhoods",
    replacement: "/blog/buenos-aires-rajony",
  },
  {
    slug: "mendoza-wine-route",
    replacement: "/blog/mendoza-vinnyj-gid",
  },
];

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
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
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  }

  const { createSupabaseAdminClient } = await import(
    pathToFileURL(path.join(root, "src/lib/supabase/admin.ts")).href
  );

  const supabase = createSupabaseAdminClient();
  const slugs = ORPHAN_BLOG_SLUGS.map((item) => item.slug);

  const { data: docs, error } = await supabase
    .from("content_documents")
    .select("id, slug, locale, status, title")
    .eq("doc_type", "blog")
    .in("slug", slugs);

  if (error) throw new Error(error.message);

  if (!docs?.length) {
    console.log("Orphan blog slugs: документов не найдено (уже архивированы или не импортировались)");
    return;
  }

  let archived = 0;
  for (const doc of docs) {
    const meta = ORPHAN_BLOG_SLUGS.find((item) => item.slug === doc.slug);
    console.log(
      `${dryRun ? "[dry-run] " : ""}archive ${doc.id} (${doc.slug}, ${doc.status}) → ${meta?.replacement ?? "?"}`
    );

    if (dryRun || doc.status === "archived") continue;

    const { error: updateError } = await supabase
      .from("content_documents")
      .update({ status: "archived", published_at: null })
      .eq("id", doc.id);

    if (updateError) throw new Error(`${doc.id}: ${updateError.message}`);
    archived += 1;
  }

  console.log(`Done: ${archived} archived, ${docs.length - archived} skipped`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
