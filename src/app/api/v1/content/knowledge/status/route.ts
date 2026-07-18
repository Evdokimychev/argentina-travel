import { NextResponse } from "next/server";
import { handlePublicApiRequest, publicApiJson } from "@/lib/public-api/handlers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_STATUS_IDS = 200;

export async function POST(request: Request) {
  return handlePublicApiRequest(
    request,
    "content:status",
    async (req) => {
      const body = (await req.json().catch(() => null)) as { cmsIds?: unknown } | null;
      if (!body || !Array.isArray(body.cmsIds)) {
        return publicApiJson({ error: "Ожидается массив cmsIds" }, { status: 400 });
      }
      const cmsIds = [
        ...new Set(body.cmsIds.filter((id): id is string => typeof id === "string" && id.length <= 260)),
      ];
      if (cmsIds.length === 0 || cmsIds.length > MAX_STATUS_IDS) {
        return publicApiJson(
          { error: `Укажите от 1 до ${MAX_STATUS_IDS} идентификаторов` },
          { status: 400 }
        );
      }

      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("content_documents")
        .select("id, status, slug, locale, title, updated_at, published_at")
        .in("id", cmsIds);
      if (error) return publicApiJson({ error: error.message }, { status: 500 });

      const rows = new Map((data ?? []).map((row) => [row.id, row]));
      const documents = cmsIds.flatMap((cmsId) => {
        const row = rows.get(cmsId);
        if (!row) return [];
        return [
          {
            cmsId: row.id,
            status: row.status,
            slug: row.slug,
            locale: row.locale,
            title: row.title,
            updatedAt: row.updated_at,
            publishedAt: row.published_at,
            publicUrl:
              row.status === "published"
                ? new URL(`/blog/${encodeURIComponent(row.slug)}`, req.url).toString()
                : null,
          },
        ];
      });

      return publicApiJson({
        ok: true,
        documents,
        missing: cmsIds.filter((cmsId) => !rows.has(cmsId)),
      });
    },
    ["POST"]
  );
}

export async function OPTIONS(request: Request) {
  return handlePublicApiRequest(
    request,
    "content:status",
    async () => NextResponse.json({ ok: true }),
    ["POST"]
  );
}
