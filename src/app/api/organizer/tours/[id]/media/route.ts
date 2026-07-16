import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { processCmsUploadImage } from "@/lib/media/cms-media-image";
import { userHasAccountRole } from "@/types/user";

const BUCKET = "organizer-products";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);
  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;
  const { data: product, error: productError } = await supabase
    .from("tours")
    .select("owner_user_id")
    .eq("id", id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }
  if (!product || product.owner_user_id !== sessionUser.id) {
    return NextResponse.json({ error: "Предложение не найдено" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Выберите изображение" }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Допустимы только изображения" }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Фото должно быть не больше 5 МБ" }, { status: 413 });
  }

  const processed = await processCmsUploadImage(
    Buffer.from(await file.arrayBuffer()),
    file.type
  );
  if ("error" in processed) {
    return NextResponse.json({ error: processed.error }, { status: 400 });
  }

  const storagePath = `${sessionUser.id}/${id}/${randomUUID()}.${processed.extension}`;
  const admin = createSupabaseAdminClient();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, processed.buffer, {
      contentType: processed.mimeType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  return NextResponse.json({ url: data.publicUrl });
}
