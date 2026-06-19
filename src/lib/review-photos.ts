import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const TOURIST_REVIEW_PHOTOS_BUCKET = "tourist-review-photos";
export const TOURIST_REVIEW_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const TOURIST_REVIEW_PHOTOS_MAX = 5;

type DbClient = SupabaseClient<Database>;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
}

export function buildReviewPhotoStoragePath(userId: string, fileName: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "jpg";
  const safeExt = ext && /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
  return `${userId}/${crypto.randomUUID()}.${safeExt}`;
}

export function resolveReviewPhotoPublicUrl(
  supabase: DbClient,
  storagePath: string
): string {
  const { data } = supabase.storage.from(TOURIST_REVIEW_PHOTOS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadReviewPhoto(
  supabase: DbClient,
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string } | { error: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Выберите файл изображения" };
  }
  if (file.size > TOURIST_REVIEW_PHOTO_MAX_BYTES) {
    return { error: "Фото должно быть не больше 5 МБ" };
  }

  const storagePath = buildReviewPhotoStoragePath(userId, sanitizeFileName(file.name));
  onProgress?.(10);

  const { error } = await supabase.storage
    .from(TOURIST_REVIEW_PHOTOS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return { error: error.message || "Не удалось загрузить фото" };
  }

  onProgress?.(100);
  return { url: resolveReviewPhotoPublicUrl(supabase, storagePath) };
}
