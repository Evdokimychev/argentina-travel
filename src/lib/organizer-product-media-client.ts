import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export async function uploadOrganizerProductImage(
  productId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Выберите изображение JPEG, PNG, WebP, AVIF или GIF");
  }
  if (file.size <= 0 || file.size > ORGANIZER_TOUR_PHOTO_MAX_BYTES) {
    throw new Error("Фото должно быть не больше 5 МБ");
  }

  const form = new FormData();
  form.set("file", file);
  const response = await fetch(
    `/api/organizer/tours/${encodeURIComponent(productId)}/media`,
    { method: "POST", body: form, credentials: "same-origin" }
  );
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Не удалось загрузить фото");
  }
  return payload.url;
}
