import { NextResponse } from "next/server";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createCmsDocument } from "@/lib/cms/content-server";
import { parseKnowledgePackage } from "@/lib/cms/knowledge-import";
import { handlePublicApiRequest, publicApiJson } from "@/lib/public-api/handlers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_IMPORT_CANDIDATES = 100;

export async function POST(request: Request) {
  return handlePublicApiRequest(
    request,
    "content:write",
    async (req, { key }) => {
      const requestBody = (await req.json().catch(() => null)) as unknown;
      const parsed = parseKnowledgePackage(requestBody);
      if (!parsed.value || parsed.value.candidates.length === 0) {
        return publicApiJson(
          { error: "В пакете нет корректных материалов", validationErrors: parsed.errors },
          { status: 400 }
        );
      }
      if (parsed.value.candidates.length > MAX_IMPORT_CANDIDATES) {
        return publicApiJson(
          { error: `За один запрос можно импортировать не более ${MAX_IMPORT_CANDIDATES} материалов` },
          { status: 400 }
        );
      }

      const supabase = createSupabaseAdminClient();
      const cmsIds = parsed.value.candidates.map(
        (candidate) => `blog:${candidate.slug}:${candidate.locale}`
      );
      const { data: existingRows, error: existingError } = await supabase
        .from("content_documents")
        .select("id, status, slug, locale, updated_at")
        .in("id", cmsIds);
      if (existingError) {
        return publicApiJson({ error: existingError.message }, { status: 500 });
      }

      const existing = new Map((existingRows ?? []).map((row) => [row.id, row]));
      const created: Array<Record<string, unknown>> = [];
      const skipped: Array<Record<string, unknown>> = [];

      for (const candidate of parsed.value.candidates) {
        const cmsId = `blog:${candidate.slug}:${candidate.locale}`;
        const previous = existing.get(cmsId);
        if (previous) {
          skipped.push({
            id: candidate.id,
            cmsId,
            slug: previous.slug,
            status: previous.status,
            updatedAt: previous.updated_at,
            reason: "already_imported",
          });
          continue;
        }

        const result = await createCmsDocument(supabase, {
          docType: "blog",
          slug: candidate.slug,
          locale: candidate.locale,
          title: candidate.title,
          body: candidate.body,
          seo: candidate.seo,
          status: "draft",
          actorId: key.createdBy,
        });
        if ("error" in result) {
          skipped.push({ id: candidate.id, cmsId, reason: result.error });
          continue;
        }

        created.push({
          id: candidate.id,
          cmsId: result.document.id,
          title: result.document.title,
          slug: result.document.slug,
          status: result.document.status,
          updatedAt: result.document.updatedAt,
        });
      }

      await writeAdminAuditLog({
        actorUserId: key.createdBy,
        action: "cms.knowledge_api_import",
        entityType: "content_document",
        payload: {
          apiKeyId: key.id,
          exportId: parsed.value.exportId,
          candidates: parsed.value.candidates.length,
          created: created.length,
          skipped: skipped.length,
          validationErrors: parsed.errors.length,
        },
        ipAddress: clientIpFromRequest(req),
      });

      return publicApiJson({
        ok: skipped.every((item) => item.reason === "already_imported"),
        exportId: parsed.value.exportId,
        created,
        skipped,
        validationErrors: parsed.errors,
      });
    },
    ["POST"]
  );
}

export async function OPTIONS(request: Request) {
  return handlePublicApiRequest(
    request,
    "content:write",
    async () => NextResponse.json({ ok: true }),
    ["POST"]
  );
}
