import { NextResponse } from "next/server";
import { isUuid } from "@/lib/admin/user-identity-management";
import { authorizeOrganizerMobility } from "@/lib/mobility/organizer-auth-server";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMobilityVertical } from "@/types/mobility";

const BUCKET = "mobility-private-documents";
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 11 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл слишком большой. Максимум 10 МБ." }, { status: 413 });
  }
  const form = await request.formData().catch(() => null);
  const vertical = form?.get("vertical");
  if (!form || !isMobilityVertical(vertical)) return NextResponse.json({ error: "Выберите раздел документа." }, { status: 400 });
  const auth = await authorizeOrganizerMobility(vertical);
  if (!auth.ok) return auth.response;
  const file = form.get("file");
  const vehicleId = String(form.get("vehicleId") ?? "");
  const documentType = String(form.get("documentType") ?? "").trim();
  const identifierLast4 = String(form.get("identifierLast4") ?? "").replace(/[^A-Za-z0-9]/g, "").slice(-4);
  const expiresAt = String(form.get("expiresAt") ?? "");
  if (!(file instanceof File) || !isUuid(vehicleId) || !ALLOWED_TYPES.has(file.type)
    || file.size < 1 || file.size > 10 * 1024 * 1024
    || !["registration", "insurance", "inspection", "driver_license", "passenger_license"].includes(documentType)
    || !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    return NextResponse.json({ error: "Проверьте файл, тип документа и срок действия." }, { status: 400 });
  }
  const storagePath = `${auth.user.id}/${vehicleId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const db = createSupabaseAdminClient();
  const { error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: "private, no-store",
  });
  if (uploadError) return NextResponse.json({ error: "Не удалось безопасно сохранить документ. Повторите позже." }, { status: 503 });

  const result = await callMobilityRpc<Record<string, unknown>>("mobility_register_private_document", {
    p_actor_user_id: auth.user.id,
    p_vehicle_id: vehicleId,
    p_document_type: documentType,
    p_storage_object_ref: storagePath,
    p_identifier_last4: identifierLast4,
    p_expires_at: expiresAt,
  });
  if (!result.ok) {
    await db.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: result.message, code: result.code }, { status: result.code === "FORBIDDEN" ? 403 : 400 });
  }
  return NextResponse.json({ document: result.data }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
