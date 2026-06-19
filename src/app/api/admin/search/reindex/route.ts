import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { reindexSearchDocuments } from "@/lib/search/search-indexer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const result = await reindexSearchDocuments(supabase);

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "search.reindex",
    entityType: "search_documents",
    payload: {
      ok: result.ok,
      indexed: result.indexed,
      removed: result.removed,
      error: result.error,
    },
    ipAddress: clientIpFromRequest(request),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Не удалось переиндексировать поиск" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    indexed: result.indexed,
    removed: result.removed,
  });
}
