import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { getCmsRevisionById } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string; revisionId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id, revisionId } = await context.params;
  const decodedDocumentId = decodeURIComponent(id);
  const decodedRevisionId = decodeURIComponent(revisionId);
  const supabase = createSupabaseAdminClient();
  const revision = await getCmsRevisionById(supabase, decodedDocumentId, decodedRevisionId);

  if (!revision) {
    return NextResponse.json({ error: "Ревизия не найдена" }, { status: 404 });
  }

  return NextResponse.json({ revision });
}
