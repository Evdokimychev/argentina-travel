import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
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
): Promise<{ asset: CmsMediaAssetRow } | { error: string }> {
  const mime = input.file.type || "application/octet-stream";
  if (!mime.startsWith("image/")) {
    return { error: "Допустимы только изображения (JPEG, PNG, WebP, GIF, AVIF)" };
  }

  const id = randomUUID();
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const baseName = sanitizeFilename(input.file.name.replace(/\.[^.]+$/, "")) || "upload";
  const storagePath = `uploads/${new Date().getFullYear()}/${id}-${baseName}.${ext}`;

  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(CMS_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
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
    mime_type: mime,
    file_size: buffer.byteLength,
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

  return { asset: row as CmsMediaAssetRow };
}

export async function updateCmsMediaAsset(
  supabase: DbClient,
  id: string,
  patch: { title?: string; alt?: string; category?: string; tags?: string[]; role?: string },
  actorId: string
): Promise<{ asset: CmsMediaAssetRow } | { error: string }> {
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
  return { asset: data as CmsMediaAssetRow };
}

export async function deleteCmsMediaAsset(
  supabase: DbClient,
  id: string
): Promise<{ ok: true } | { error: string }> {
  const { data, error: fetchError } = await supabase
    .from("cms_media_assets")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !data) return { error: fetchError?.message ?? "Asset не найден" };

  await supabase.storage.from(CMS_MEDIA_BUCKET).remove([data.storage_path]);

  const { error } = await supabase.from("cms_media_assets").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

const MANIFEST_PATH = path.join(process.cwd(), "src/data/media-library/manifest.json");

export async function syncCmsMediaToManifest(
  supabase: DbClient
): Promise<{ added: number; total: number } | { error: string }> {
  const { data: rows, error } = await supabase
    .from("cms_media_assets")
    .select("*")
    .eq("manifest_synced", false);

  if (error) return { error: error.message };
  if (!rows?.length) {
    const manifest = await readManifestFile();
    return { added: 0, total: manifest.assets.length };
  }

  const manifest = await readManifestFile();
  const existingIds = new Set(manifest.assets.map((a) => a.id));
  let added = 0;

  for (const row of rows as CmsMediaAssetRow[]) {
    const asset = cmsMediaRowToManifestAsset(row);
    if (existingIds.has(asset.id)) continue;
    manifest.assets.push(asset);
    existingIds.add(asset.id);
    added += 1;
  }

  manifest.version = (manifest.version ?? 1) + (added > 0 ? 1 : 0);

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const syncedIds = (rows as CmsMediaAssetRow[]).map((r) => r.id);
  if (syncedIds.length > 0) {
    await supabase.from("cms_media_assets").update({ manifest_synced: true }).in("id", syncedIds);
  }

  return { added, total: manifest.assets.length };
}

async function readManifestFile(): Promise<{ version: number; assets: MediaAsset[] }> {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as { version: number; assets: MediaAsset[] };
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
    if (!ids.has(asset.id)) {
      merged.push(asset);
      ids.add(asset.id);
    }
  }

  return { version: manifest.version, assets: merged };
}
