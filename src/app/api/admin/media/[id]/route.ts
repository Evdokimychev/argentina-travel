import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  cmsMediaRowToManifestAsset,
  deleteCmsMediaAsset,
  updateCmsMediaAsset,
} from "@/lib/media/cms-media-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as {
    title?: string;
    alt?: string;
    category?: string;
    role?: string;
    tags?: string[];
  };

  const supabase = createSupabaseAdminClient();
  const result = await updateCmsMediaAsset(supabase, decodeURIComponent(id), body, auth.actorId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.media.update",
    entityType: "cms_media_asset",
    entityId: id,
    payload: { manifestSync: result.manifestSync },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({
    asset: cmsMediaRowToManifestAsset(result.asset),
    manifestSync: result.manifestSync,
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const result = await deleteCmsMediaAsset(supabase, decodeURIComponent(id));

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.media.delete",
    entityType: "cms_media_asset",
    entityId: id,
    payload: { manifestSync: result.manifestSync },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true, manifestSync: result.manifestSync });
}
