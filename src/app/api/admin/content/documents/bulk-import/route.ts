import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { seedCmsFromTs } from "@/lib/cms/cms-ts-seed";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CmsDocType } from "@/types/cms-content";

type BulkImportBody = {
  docTypes?: CmsDocType[];
  publish?: boolean;
  skipExisting?: boolean;
};

const ALLOWED_TYPES: CmsDocType[] = ["legal", "blog", "guide", "destination", "place"];

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as BulkImportBody;
  const docTypes = body.docTypes?.length
    ? body.docTypes.filter((type) => ALLOWED_TYPES.includes(type))
    : undefined;

  const supabase = createSupabaseAdminClient();
  const result = await seedCmsFromTs(supabase, {
    docTypes,
    publish: body.publish ?? true,
    skipExisting: body.skipExisting ?? true,
    actorId: auth.actorId,
  });

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.bulk_import",
    entityType: "content_document",
    payload: {
      docTypes: docTypes ?? ALLOWED_TYPES,
      created: result.created,
      skipped: result.skipped,
      updated: result.updated,
      errorCount: result.errors.length,
    },
    ipAddress: clientIpFromRequest(request),
  });

  if (result.errors.length) {
    return NextResponse.json(
      {
        ok: false,
        ...result,
        message: "Импорт завершён с ошибками",
      },
      { status: 207 }
    );
  }

  return NextResponse.json({
    ok: true,
    ...result,
    message: `Импортировано: ${result.created}, пропущено: ${result.skipped}`,
  });
}
