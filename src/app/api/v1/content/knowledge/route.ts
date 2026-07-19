import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { importCmsDocumentsAtomic } from "@/lib/cms/content-server";
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
      const items = parsed.value.candidates.map((candidate) => ({
          sourceId: candidate.id,
          docType: "blog" as const,
          slug: candidate.slug,
          locale: candidate.locale,
          title: candidate.title,
          body: candidate.body,
          seo: candidate.seo,
        }));
      const exportIdentity = createHash("sha256").update(parsed.value.exportId).digest("hex").slice(0, 32);
      const result = await importCmsDocumentsAtomic(supabase, {
        operationId: `api:${key.id}:${exportIdentity}`,
        items,
        actorId: key.createdBy,
        ipAddress: clientIpFromRequest(req),
      });
      if ("error" in result) {
        const status = result.code === "CONFLICT" ? 409 : result.code === "INVALID" ? 400 : 500;
        return publicApiJson({ error: result.error, code: result.code }, { status });
      }

      return publicApiJson({
        ok: true,
        exportId: parsed.value.exportId,
        operationId: result.operationId,
        replayed: result.replayed,
        created: result.created,
        skipped: result.skipped,
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
