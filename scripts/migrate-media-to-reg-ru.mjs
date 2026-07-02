#!/usr/bin/env node
/**
 * Bulk migration: public/media + Supabase Storage → Reg.ru FTP + DB URL rewrite.
 *
 * Usage:
 *   node scripts/migrate-media-to-reg-ru.mjs --dry-run
 *   node scripts/migrate-media-to-reg-ru.mjs --upload
 *   node scripts/migrate-media-to-reg-ru.mjs --upload --rewrite-db
 */
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "basic-ftp";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_MEDIA_DIR = path.join(ROOT, "public/media");

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(ROOT, file);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvLocal();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const shouldUpload = args.has("--upload");
const shouldRewriteDb = args.has("--rewrite-db");

if (!dryRun && !shouldUpload && !shouldRewriteDb) {
  console.log(`Usage:
  node scripts/migrate-media-to-reg-ru.mjs --dry-run
  node scripts/migrate-media-to-reg-ru.mjs --upload
  node scripts/migrate-media-to-reg-ru.mjs --upload --rewrite-db`);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cdnOrigin = (process.env.NEXT_PUBLIC_MEDIA_CDN_URL ?? "").replace(/\/+$/, "");
const ftpHost = process.env.MEDIA_FTP_HOST;
const ftpUser = process.env.MEDIA_FTP_USER;
const ftpPassword = process.env.MEDIA_FTP_PASSWORD;
const ftpRoot = (process.env.MEDIA_FTP_REMOTE_ROOT ?? "").replace(/\/+$/, "");

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

async function listFilesRecursive(dir, prefix = "") {
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(abs, rel)));
    } else if (entry.isFile()) {
      files.push({ rel: `media/${rel}`, abs });
    }
  }

  return files;
}

async function withFtp(fn) {
  const client = new Client(60_000);
  client.ftp.verbose = process.env.MEDIA_FTP_VERBOSE === "1";
  await client.access({
    host: requireEnv("MEDIA_FTP_HOST", ftpHost),
    port: Number(process.env.MEDIA_FTP_PORT ?? "21"),
    user: requireEnv("MEDIA_FTP_USER", ftpUser),
    password: requireEnv("MEDIA_FTP_PASSWORD", ftpPassword),
    secure: process.env.MEDIA_FTP_SECURE === "true",
  });
  try {
    return await fn(client);
  } finally {
    client.close();
  }
}

async function ensureRemoteDir(client, remoteDir) {
  const segments = remoteDir.split("/").filter(Boolean);
  let current = remoteDir.startsWith("/") ? "" : "";

  for (const segment of segments) {
    current = current ? `${current}/${segment}` : `/${segment}`;
    try {
      await client.send(`MKD ${current}`);
    } catch {
      // ignore existing dir
    }
  }
}

function rewriteSupabaseUrl(url) {
  if (!cdnOrigin) return url;
  try {
    const parsed = new URL(url);
    const cmsMatch = parsed.pathname.match(/\/storage\/v1\/object\/public\/cms-media\/(.+)/i);
    if (cmsMatch?.[1]) return `${cdnOrigin}/${cmsMatch[1]}`;
    const reviewMatch = parsed.pathname.match(/\/storage\/v1\/object\/public\/tourist-review-photos\/(.+)/i);
    if (reviewMatch?.[1]) return `${cdnOrigin}/reviews/${reviewMatch[1]}`;
  } catch {
    return url;
  }
  return url;
}

async function collectSupabaseObjects(supabase, bucket) {
  const objects = [];
  const queue = [""];

  while (queue.length > 0) {
    const prefix = queue.shift();
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) throw new Error(`${bucket}: ${error.message}`);

    for (const item of data ?? []) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id == null) {
        queue.push(itemPath);
      } else {
        objects.push(itemPath);
      }
    }
  }

  return objects;
}

async function collectSupabaseObjectsSafe(supabase, bucket) {
  try {
    return await collectSupabaseObjects(supabase, bucket);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Supabase ${bucket} skipped: ${message}`);
    return [];
  }
}

async function uploadLocalMedia(client) {
  const files = await listFilesRecursive(PUBLIC_MEDIA_DIR);
  console.log(`Local editorial files: ${files.length}`);

  let uploaded = 0;
  for (const file of files) {
    const remotePath = `${ftpRoot}/${file.rel}`;
    if (dryRun) {
      console.log(`[dry-run] upload ${file.rel} -> ${remotePath}`);
      continue;
    }

    await ensureRemoteDir(client, remotePath.slice(0, remotePath.lastIndexOf("/")));
    await client.uploadFrom(file.abs, remotePath);
    uploaded += 1;
    if (uploaded % 25 === 0 || uploaded === files.length) {
      console.log(`uploaded ${uploaded}/${files.length} editorial files`);
    }
  }
}

async function uploadSupabaseBucket(client, supabase, bucket, remotePrefix = "") {
  const objects = await collectSupabaseObjects(supabase, bucket);
  console.log(`Supabase ${bucket}: ${objects.length} objects`);

  for (const objectPath of objects) {
    const { data, error } = await supabase.storage.from(bucket).download(objectPath);
    if (error || !data) {
      console.warn(`skip ${bucket}/${objectPath}: ${error?.message ?? "empty"}`);
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const remotePath = remotePrefix
      ? `${ftpRoot}/${remotePrefix}/${objectPath}`
      : `${ftpRoot}/${objectPath}`;

    if (dryRun) {
      console.log(`[dry-run] upload ${bucket}/${objectPath} -> ${remotePath}`);
      continue;
    }

    await ensureRemoteDir(client, remotePath.slice(0, remotePath.lastIndexOf("/")));
    const tmp = path.join(ROOT, ".tmp-media-upload");
    await fsPromises.writeFile(tmp, buffer);
    await client.uploadFrom(tmp, remotePath);
    await fsPromises.unlink(tmp).catch(() => undefined);
    console.log(`uploaded ${bucket}/${objectPath}`);
  }
}

async function rewriteDatabaseUrlsPg() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for --rewrite-db");
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const cmsSelect = await client.query("select id, public_url from cms_media_assets");
    let cmsUpdated = 0;
    for (const row of cmsSelect.rows) {
      const nextUrl = rewriteSupabaseUrl(row.public_url);
      if (nextUrl === row.public_url) continue;
      if (dryRun) {
        console.log(`[dry-run] cms ${row.id}: ${row.public_url} -> ${nextUrl}`);
        cmsUpdated += 1;
        continue;
      }
      await client.query("update cms_media_assets set public_url = $1 where id = $2", [nextUrl, row.id]);
      cmsUpdated += 1;
    }

    const reviewSelect = await client.query("select id, photos from tourist_reviews where photos is not null");
    let reviewUpdated = 0;
    for (const row of reviewSelect.rows) {
      const photos = Array.isArray(row.photos) ? row.photos : [];
      const nextPhotos = photos.map((photo) => (typeof photo === "string" ? rewriteSupabaseUrl(photo) : photo));
      const changed = nextPhotos.some((photo, index) => photo !== photos[index]);
      if (!changed) continue;
      if (dryRun) {
        console.log(`[dry-run] review ${row.id}: ${photos.length} photos rewritten`);
        reviewUpdated += 1;
        continue;
      }
      await client.query("update tourist_reviews set photos = $1::jsonb where id = $2", [
        JSON.stringify(nextPhotos),
        row.id,
      ]);
      reviewUpdated += 1;
    }

    console.log(`DB rewrite (Postgres): cms=${cmsUpdated}, reviews=${reviewUpdated}`);
  } finally {
    await client.end();
  }
}

async function rewriteDatabaseUrls(supabase) {
  const { data: cmsRows, error: cmsError } = await supabase.from("cms_media_assets").select("id, public_url");
  if (cmsError) throw cmsError;

  let cmsUpdated = 0;
  for (const row of cmsRows ?? []) {
    const nextUrl = rewriteSupabaseUrl(row.public_url);
    if (nextUrl === row.public_url) continue;
    if (dryRun) {
      console.log(`[dry-run] cms ${row.id}: ${row.public_url} -> ${nextUrl}`);
      cmsUpdated += 1;
      continue;
    }
    const { error } = await supabase.from("cms_media_assets").update({ public_url: nextUrl }).eq("id", row.id);
    if (error) throw error;
    cmsUpdated += 1;
  }

  const { data: reviews, error: reviewError } = await supabase
    .from("tourist_reviews")
    .select("id, photos")
    .not("photos", "is", null);
  if (reviewError) throw reviewError;

  let reviewUpdated = 0;
  for (const review of reviews ?? []) {
    const photos = Array.isArray(review.photos) ? review.photos : [];
    const nextPhotos = photos.map((photo) => (typeof photo === "string" ? rewriteSupabaseUrl(photo) : photo));
    const changed = nextPhotos.some((photo, index) => photo !== photos[index]);
    if (!changed) continue;

    if (dryRun) {
      console.log(`[dry-run] review ${review.id}: ${photos.length} photos rewritten`);
      reviewUpdated += 1;
      continue;
    }

    const { error } = await supabase.from("tourist_reviews").update({ photos: nextPhotos }).eq("id", review.id);
    if (error) throw error;
    reviewUpdated += 1;
  }

  console.log(`DB rewrite: cms=${cmsUpdated}, reviews=${reviewUpdated}`);
}

async function main() {
  if (shouldUpload || dryRun) {
    requireEnv("NEXT_PUBLIC_MEDIA_CDN_URL", cdnOrigin);
    requireEnv("MEDIA_FTP_REMOTE_ROOT", ftpRoot);
  }

  if (dryRun) {
    const localFiles = await listFilesRecursive(PUBLIC_MEDIA_DIR);
    console.log(`Would upload ${localFiles.length} editorial files to ${ftpRoot}/media/...`);
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);
      const cmsObjects = await collectSupabaseObjectsSafe(supabase, "cms-media");
      const reviewObjects = await collectSupabaseObjectsSafe(supabase, "tourist-review-photos");
      console.log(`Would upload ${cmsObjects.length} cms-media + ${reviewObjects.length} review photos`);
    }
    if (shouldRewriteDb) await rewriteDatabaseUrlsPg();
    return;
  }

  if (shouldUpload) {
    requireEnv("MEDIA_FTP_USER", ftpUser);
    requireEnv("MEDIA_FTP_PASSWORD", ftpPassword);
    const supabase =
      supabaseUrl && serviceKey
        ? createClient(supabaseUrl, serviceKey)
        : null;
    await withFtp(async (client) => {
      await uploadLocalMedia(client);
      if (supabase) {
        try {
          await uploadSupabaseBucket(client, supabase, "cms-media");
        } catch (error) {
          console.warn(
            `Supabase cms-media upload skipped: ${error instanceof Error ? error.message : error}`
          );
        }
        try {
          await uploadSupabaseBucket(client, supabase, "tourist-review-photos", "reviews");
        } catch (error) {
          console.warn(
            `Supabase review photos upload skipped: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    });
  }

  if (shouldRewriteDb) {
    await rewriteDatabaseUrlsPg();
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
