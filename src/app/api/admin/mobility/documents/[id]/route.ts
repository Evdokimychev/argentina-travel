import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "mobility-private-documents";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") return NextResponse.json({ error: "Просмотр документа требует личную сессию." }, { status: 403 });
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Документ не найден." }, { status: 404 });
  const db = createSupabaseAdminClient();
  const document = await callMobilityRpc<string>("mobility_get_document_storage_ref", { p_document_id: id });
  if (!document.ok) return NextResponse.json({ error: "Документ не найден." }, { status: document.code === "NOT_FOUND" ? 404 : 503 });
  const { data, error: signedError } = await db.storage.from(BUCKET).createSignedUrl(document.data, 300, {
    download: false,
  });
  if (signedError || !data?.signedUrl) return NextResponse.json({ error: "Документ временно недоступен." }, { status: 503 });
  return NextResponse.json({ url: data.signedUrl, expiresInSeconds: 300 }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
