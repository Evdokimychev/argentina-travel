import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { cmsMutationHttpStatus, publishCmsDocument } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "content.publish");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const body = (await request.json().catch(() => null)) as { expectedVersion?: number } | null;
  if (!body || !Number.isInteger(body.expectedVersion) || (body.expectedVersion ?? 0) < 1) {
    return NextResponse.json({ error: "Обновите страницу и повторите публикацию" }, { status: 409 });
  }
  const supabase = createSupabaseAdminClient();
  const result = await publishCmsDocument(supabase, decodedId, {
    actorId: auth.actorId,
    expectedVersion: body.expectedVersion!,
    ipAddress: clientIpFromRequest(request),
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: cmsMutationHttpStatus(result.code) });
  }

  return NextResponse.json({ document: result.document });
}
