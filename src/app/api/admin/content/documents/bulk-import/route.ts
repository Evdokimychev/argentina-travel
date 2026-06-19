import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { seedCmsFromTs, seedCmsI18nPilot, seedCmsI18nEmptyStubs } from "@/lib/cms/cms-ts-seed";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CmsDocType } from "@/types/cms-content";

type BulkImportBody = {
  docTypes?: CmsDocType[];
  publish?: boolean;
  skipExisting?: boolean;
  /** E43: import es/en pilot locale variants */
  includeI18nPilot?: boolean;
  /** E77: import draft es/en empty stubs for top-10 priority slugs */
  includeI18nStubs?: boolean;
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
  const seedOptions = {
    docTypes,
    publish: body.publish ?? true,
    skipExisting: body.skipExisting ?? true,
    actorId: auth.actorId,
  };

  const result = await seedCmsFromTs(supabase, seedOptions);

  let pilotResult = { created: 0, skipped: 0, updated: 0, total: 0, errors: [] as string[] };
  if (body.includeI18nPilot) {
    pilotResult = await seedCmsI18nPilot(supabase, seedOptions);
    result.created += pilotResult.created;
    result.skipped += pilotResult.skipped;
    result.updated += pilotResult.updated;
    result.errors.push(...pilotResult.errors);
  }

  if (body.includeI18nStubs) {
    const stubResult = await seedCmsI18nEmptyStubs(supabase, seedOptions);
    result.created += stubResult.created;
    result.skipped += stubResult.skipped;
    result.updated += stubResult.updated;
    result.errors.push(...stubResult.errors);
  }

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
