import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  cmsMediaRowToManifestAsset,
  listCmsMediaAssets,
  readManifestWithCmsUploads,
  syncCmsMediaToManifest,
  uploadCmsMediaAsset,
} from "@/lib/media/cms-media-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MediaCategory, MediaAssetRole } from "@/types/media-asset";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const manifest = await readManifestWithCmsUploads(supabase);
  const cmsRows = await listCmsMediaAssets(supabase);

  return NextResponse.json({
    assets: manifest.assets,
    cmsUploads: cmsRows.map(cmsMediaRowToManifestAsset),
    stats: {
      total: manifest.assets.length,
      cmsPendingSync: cmsRows.filter((r) => !r.manifest_synced).length,
    },
  });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "");
  const alt = String(form.get("alt") ?? "");
  const category = String(form.get("category") ?? "blog-article") as MediaCategory;
  const role = String(form.get("role") ?? "content") as MediaAssetRole;
  const tagsRaw = String(form.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const supabase = createSupabaseAdminClient();
  const result = await uploadCmsMediaAsset(supabase, {
    file,
    title: title || undefined,
    alt: alt || undefined,
    category,
    role,
    tags,
    actorId: auth.actorId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.media.upload",
    entityType: "cms_media_asset",
    entityId: result.asset.id,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ asset: cmsMediaRowToManifestAsset(result.asset) });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const result = await syncCmsMediaToManifest(supabase);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.media.sync_manifest",
    entityType: "media_manifest",
    entityId: "manifest.json",
    payload: result,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json(result);
}
