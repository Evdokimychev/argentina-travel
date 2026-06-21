import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processCmsUploadImage } from "@/lib/media/cms-media-image";
import type { Database } from "@/types/database";
import type { MediaAsset, MediaCategory, MediaAssetRole } from "@/types/media-asset";

type DbClient = SupabaseClient<Database>;

export const CMS_MEDIA_BUCKET = "cms-media";

export type CmsMediaAssetRow = {
  id: string;
  title: string;
  alt: string;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  category: string;
  tags: string[];
  role: string;
  manifest_synced: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CmsMediaUploadInput = {
  file: File;
  title?: string;
  alt?: string;
  category?: MediaCategory;
  role?: MediaAssetRole;
  tags?: string[];
  actorId: string;
};

export type CmsManifestSyncResult = {
  added: number;
  updated: number;
  removed: number;
  total: number;
  skipped?: boolean;
  error?: string;
};

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function cmsMediaRowToManifestAsset(row: CmsMediaAssetRow): MediaAsset {
  return {
    id: `cms:${row.id}`,
    title: row.title,
    alt: row.alt || row.title,
    source: "local",
    sourceUrl: row.public_url,
    license: "Uploaded via CMS",
    category: (row.category as MediaCategory) || "blog-article",
    tags: row.tags ?? [],
    localPath: row.public_url,
    role: (row.role as MediaAssetRole) || "content",
    attributionRequired: false,
  };
}

export async function listCmsMediaAssets(supabase: DbClient): Promise<CmsMediaAssetRow[]> {
  const { data, error } = await supabase
    .from("cms_media_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return [];
  return data as CmsMediaAssetRow[];
}

export async function uploadCmsMediaAsset(
  supabase: DbClient,
  input: CmsMediaUploadInput
): Promise<{ asset: CmsMediaAssetRow; manifestSync: CmsManifestSyncResult } | { error: string }> {
  const mime = input.file.type || "application/octet-stream";
  if (!mime.startsWith("image/")) {
    return { error: "Допустимы только изображения (JPEG, PNG, WebP, GIF, AVIF)" };
  }

  const id = randomUUID();
  const rawBuffer = Buffer.from(await input.file.arrayBuffer());
  const processed = await processCmsUploadImage(rawBuffer, mime);
  if ("error" in processed) {
    return { error: processed.error };
  }

  const baseName = sanitizeFilename(input.file.name.replace(/\.[^.]+$/, "")) || "upload";
  const storagePath = `uploads/${new Date().getFullYear()}/${id}-${baseName}.${processed.extension}`;

  const { error: uploadError } = await supabase.storage
    .from(CMS_MEDIA_BUCKET)
    .upload(storagePath, processed.buffer, {
      contentType: processed.mimeType,
      upsert: false,
      cacheControl: "31536000",
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicData } = supabase.storage.from(CMS_MEDIA_BUCKET).getPublicUrl(storagePath);
  const publicUrl = publicData.publicUrl;

  const row = {
    id,
    title: input.title?.trim() || baseName,
    alt: input.alt?.trim() || input.title?.trim() || baseName,
    storage_path: storagePath,
    public_url: publicUrl,
    mime_type: processed.mimeType,
    file_size: processed.buffer.byteLength,
    width: processed.width || null,
    height: processed.height || null,
    category: input.category ?? "blog-article",
    tags: input.tags ?? [],
    role: input.role ?? "content",
    manifest_synced: false,
    created_by: input.actorId,
    updated_by: input.actorId,
  };

  const { error: insertError } = await supabase.from("cms_media_assets").insert(row);
  if (insertError) {
    await supabase.storage.from(CMS_MEDIA_BUCKET).remove([storagePath]);
    return { error: insertError.message };
  }

  const manifestSync = await autoSyncCmsMediaManifest(supabase);
  return { asset: row as CmsMediaAssetRow, manifestSync };
}

export async function updateCmsMediaAsset(
  supabase: DbClient,
  id: string,
  patch: { title?: string; alt?: string; category?: string; tags?: string[]; role?: string },
  actorId: string
): Promise<{ asset: CmsMediaAssetRow; manifestSync: CmsManifestSyncResult } | { error: string }> {
  const { data, error } = await supabase
    .from("cms_media_assets")
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.alt !== undefined ? { alt: patch.alt } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      manifest_synced: false,
      updated_by: actorId,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) return { error: error?.message ?? "Asset не найден" };

  const manifestSync = await autoSyncCmsMediaManifest(supabase);
  return { asset: data as CmsMediaAssetRow, manifestSync };
}

export async function deleteCmsMediaAsset(
  supabase: DbClient,
  id: string
): Promise<{ ok: true; manifestSync: CmsManifestSyncResult } | { error: string }> {
  const { data, error: fetchError } = await supabase
    .from("cms_media_assets")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !data) return { error: fetchError?.message ?? "Asset не найден" };

  await supabase.storage.from(CMS_MEDIA_BUCKET).remove([data.storage_path]);

  const { error } = await supabase.from("cms_media_assets").delete().eq("id", id);
  if (error) return { error: error.message };

  const manifestSync = await removeCmsMediaFromManifest(id);
  return { ok: true, manifestSync };
}

const MANIFEST_PATH = path.join(process.cwd(), "src/data/media-library/manifest.json");

async function readManifestFile(): Promise<{ version: number; assets: MediaAsset[] }> {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as { version: number; assets: MediaAsset[] };
}

async function writeManifestFile(manifest: { version: number; assets: MediaAsset[] }): Promise<void> {
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function isManifestSyncSkipped(): boolean {
  return process.env.CMS_MEDIA_SKIP_MANIFEST_SYNC === "1" || process.env.VERCEL === "1";
}

/** Best-effort sync after upload/update. Skipped on Vercel (read-only FS). */
export async function autoSyncCmsMediaManifest(supabase: DbClient): Promise<CmsManifestSyncResult> {
  if (isManifestSyncSkipped()) {
    return { added: 0, updated: 0, removed: 0, total: 0, skipped: true };
  }

  try {
    const result = await syncCmsMediaToManifest(supabase);
    if ("error" in result) {
      return { added: 0, updated: 0, removed: 0, total: 0, error: result.error };
    }
    return result;
  } catch (error) {
    return {
      added: 0,
      updated: 0,
      removed: 0,
      total: 0,
      error: error instanceof Error ? error.message : "Manifest sync failed",
    };
  }
}

export async function syncCmsMediaToManifest(
  supabase: DbClient
): Promise<CmsManifestSyncResult | { error: string }> {
  const { data: rows, error } = await supabase
    .from("cms_media_assets")
    .select("*")
    .eq("manifest_synced", false);

  if (error) return { error: error.message };

  const manifest = await readManifestFile();
  const pendingRows = (rows ?? []) as CmsMediaAssetRow[];
  let added = 0;
  let updated = 0;

  for (const row of pendingRows) {
    const asset = cmsMediaRowToManifestAsset(row);
    const index = manifest.assets.findIndex((entry) => entry.id === asset.id);
    if (index >= 0) {
      manifest.assets[index] = asset;
      updated += 1;
    } else {
      manifest.assets.push(asset);
      added += 1;
    }
  }

  if (added > 0 || updated > 0) {
    manifest.version = (manifest.version ?? 1) + 1;
    await writeManifestFile(manifest);
  }

  const syncedIds = pendingRows.map((row) => row.id);
  if (syncedIds.length > 0) {
    await supabase.from("cms_media_assets").update({ manifest_synced: true }).in("id", syncedIds);
  }

  return { added, updated, removed: 0, total: manifest.assets.length };
}

export async function removeCmsMediaFromManifest(cmsAssetId: string): Promise<CmsManifestSyncResult> {
  if (isManifestSyncSkipped()) {
    return { added: 0, updated: 0, removed: 0, total: 0, skipped: true };
  }

  try {
    const manifest = await readManifestFile();
    const assetId = `cms:${cmsAssetId}`;
    const before = manifest.assets.length;
    manifest.assets = manifest.assets.filter((entry) => entry.id !== assetId);
    const removed = before - manifest.assets.length;

    if (removed > 0) {
      manifest.version = (manifest.version ?? 1) + 1;
      await writeManifestFile(manifest);
    }

    return { added: 0, updated: 0, removed, total: manifest.assets.length };
  } catch (error) {
    return {
      added: 0,
      updated: 0,
      removed: 0,
      total: 0,
      error: error instanceof Error ? error.message : "Manifest remove failed",
    };
  }
}

export async function readManifestWithCmsUploads(
  supabase: DbClient
): Promise<{ version: number; assets: MediaAsset[] }> {
  const manifest = await readManifestFile();
  const cmsRows = await listCmsMediaAssets(supabase);
  const merged = [...manifest.assets];
  const ids = new Set(merged.map((a) => a.id));

  for (const row of cmsRows) {
    const asset = cmsMediaRowToManifestAsset(row);
    const index = merged.findIndex((entry) => entry.id === asset.id);
    if (index >= 0) {
      merged[index] = asset;
    } else {
      merged.push(asset);
      ids.add(asset.id);
    }
  }

  return { version: manifest.version, assets: merged };
}
