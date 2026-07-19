import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createCmsDocument, listCmsDocuments } from "@/lib/cms/content-server";
import { parseKnowledgePackage } from "@/lib/cms/knowledge-import";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllEntries } from "@/lib/knowledge-base/content";
import type { KbEntry } from "@/lib/knowledge-base/types";

type RequestBody = {
  action?: "preview" | "import" | "import_static";
  package?: unknown;
  selectedIds?: string[];
};

function staticPreviewItem(entry: KbEntry, existingIds: Set<string>) {
  const cmsId = `knowledge:${entry.id}:ru`;
  return {
    id: entry.id,
    cmsId,
    slug: entry.id,
    locale: "ru",
    title: entry.title,
    summary: entry.summary ?? "",
    editorialStatus: entry.editorial?.needs_attention ? "review" : "ready",
    qualityScore: entry.editorial?.needs_attention ? 70 : 100,
    source: "project-knowledge-base",
    sourceId: entry.id,
    province: entry.province ?? undefined,
    flags: entry.editorial?.needs_attention ? ["time_sensitive_content_may_be_stale"] : [],
    alreadyImported: existingIds.has(cmsId),
  };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const existing = await listCmsDocuments(supabase, { docType: "knowledge" });
  const existingIds = new Set(existing.map((document) => document.id));
  const preview = getAllEntries().map((entry) => staticPreviewItem(entry, existingIds));

  return NextResponse.json({
    package: {
      exportId: "project-knowledge-base",
      generatedAt: new Date().toISOString(),
      producer: "Встроенная база знаний проекта",
    },
    preview,
    validationErrors: [],
  });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const requestBody = (await request.json().catch(() => null)) as RequestBody | null;
  if (!requestBody) {
    return NextResponse.json({ error: "Не удалось прочитать JSON" }, { status: 400 });
  }

  if (requestBody.action === "import_static") {
    const selectedIds = new Set(
      Array.isArray(requestBody.selectedIds)
        ? requestBody.selectedIds.filter((id): id is string => typeof id === "string").slice(0, 100)
        : [],
    );
    if (selectedIds.size === 0) {
      return NextResponse.json({ error: "Не выбраны материалы для импорта" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const existing = await listCmsDocuments(supabase, { docType: "knowledge" });
    const existingIds = new Set(existing.map((document) => document.id));
    const created: Array<{ id: string; title: string }> = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    for (const entry of getAllEntries()) {
      if (!selectedIds.has(entry.id)) continue;
      const cmsId = `knowledge:${entry.id}:ru`;
      if (existingIds.has(cmsId)) {
        skipped.push({ id: entry.id, reason: "already_imported" });
        continue;
      }

      const result = await createCmsDocument(supabase, {
        docType: "knowledge",
        slug: entry.id,
        locale: "ru",
        title: entry.title,
        body: {
          kind: "blog",
          excerpt: entry.summary,
          content: entry.body,
          sections: [{ title: "Основной текст", body: entry.body }],
          collector: {
            schemaVersion: 2,
            identity: entry.id,
            source: "project-knowledge-base",
            sourceId: entry.id,
            sourceItemId: entry.id,
            fingerprint: `project:${entry.id}`,
            qualityScore: entry.editorial?.needs_attention ? 70 : 100,
            scoreBreakdown: {},
            flags: entry.editorial?.needs_attention
              ? ["time_sensitive_content_may_be_stale"]
              : [],
            category: entry.site_sections?.[0] ?? entry.type,
            province: entry.province ?? undefined,
            tags: entry.tags ?? [],
            media: entry.media?.hero?.url ? [entry.media.hero.url] : [],
            collectedAt: entry.last_verified ?? undefined,
          },
        },
        seo: {
          description: entry.summary,
          noIndex: true,
        },
        status: "draft",
        actorId: auth.actorId,
      });
      if ("error" in result) {
        skipped.push({ id: entry.id, reason: result.error });
        continue;
      }
      existingIds.add(result.document.id);
      created.push({ id: result.document.id, title: result.document.title });
    }

    await writeAdminAuditLog({
      actorUserId: auth.actorId,
      action: "cms.knowledge_import_static",
      entityType: "content_document",
      payload: { selected: selectedIds.size, created: created.length, skipped: skipped.length },
      ipAddress: clientIpFromRequest(request),
    });

    return NextResponse.json({
      ok: skipped.length === 0,
      created,
      skipped,
      message: `Создано черновиков: ${created.length}`,
    });
  }

  const parsed = parseKnowledgePackage(requestBody.package);
  if (!parsed.value || parsed.value.candidates.length === 0) {
    return NextResponse.json(
      { error: "В пакете нет корректных материалов", validationErrors: parsed.errors },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const existing = await listCmsDocuments(supabase, { docType: "knowledge" });
  const existingIds = new Set(existing.map((document) => document.id));
  const preview = parsed.value.candidates.map((candidate) => ({
    id: candidate.id,
    cmsId: `knowledge:${candidate.slug}:${candidate.locale}`,
    slug: candidate.slug,
    locale: candidate.locale,
    title: candidate.title,
    summary: candidate.summary,
    editorialStatus: candidate.editorialStatus,
    qualityScore: candidate.editorial.qualityScore,
    source: candidate.editorial.source,
    sourceId: candidate.editorial.sourceId,
    category: candidate.editorial.category,
    province: candidate.editorial.province,
    city: candidate.editorial.city,
    flags: candidate.editorial.flags,
    alreadyImported: existingIds.has(`knowledge:${candidate.slug}:${candidate.locale}`),
  }));

  if (requestBody.action !== "import") {
    return NextResponse.json({
      package: {
        exportId: parsed.value.exportId,
        generatedAt: parsed.value.generatedAt,
        producer: parsed.value.producer,
      },
      preview,
      validationErrors: parsed.errors,
    });
  }

  const selectedIds = new Set(
    Array.isArray(requestBody.selectedIds)
      ? requestBody.selectedIds.filter((id): id is string => typeof id === "string").slice(0, 100)
      : []
  );
  if (selectedIds.size === 0) {
    return NextResponse.json({ error: "Не выбраны материалы для импорта" }, { status: 400 });
  }

  const created: Array<{ id: string; title: string }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  for (const candidate of parsed.value.candidates) {
    if (!selectedIds.has(candidate.id)) continue;

    const cmsId = `knowledge:${candidate.slug}:${candidate.locale}`;
    if (existingIds.has(cmsId)) {
      skipped.push({ id: candidate.id, reason: "already_imported" });
      continue;
    }

    const result = await createCmsDocument(supabase, {
      docType: "knowledge",
      slug: candidate.slug,
      locale: candidate.locale,
      title: candidate.title,
      body: candidate.body,
      seo: candidate.seo,
      status: "draft",
      actorId: auth.actorId,
    });
    if ("error" in result) {
      skipped.push({ id: candidate.id, reason: result.error });
      continue;
    }

    existingIds.add(result.document.id);
    created.push({ id: result.document.id, title: result.document.title });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "cms.knowledge_import",
    entityType: "content_document",
    payload: {
      exportId: parsed.value.exportId,
      selected: selectedIds.size,
      created: created.length,
      skipped: skipped.length,
      validationErrors: parsed.errors.length,
    },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({
    ok: skipped.length === 0,
    created,
    skipped,
    validationErrors: parsed.errors,
    message: `Создано черновиков: ${created.length}`,
  });
}
