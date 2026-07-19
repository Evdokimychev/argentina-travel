import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { getCmsDocumentById, updateCmsDocument } from "@/lib/cms/content-server";
import { parseCmsDocumentId } from "@/types/cms-content";
import { userHasAccountRole } from "@/types/user";
import {
  CMS_AUTHOR_ARTICLE_TYPES,
  type CmsAuthorArticleBody,
  type CmsAuthorArticleRelations,
  type CmsAuthorArticleType,
  type CmsBlogSection,
  type CmsDocumentSeo,
} from "@/types/cms-content";
import { resolveAuthorArticleWorkflow } from "@/lib/cms/author-article-workflow";

type RouteContext = { params: Promise<{ id: string }> };

async function requireOrganizerAuthor() {
  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Требуется роль организатора" }, { status: 403 }),
    };
  }

  return { ok: true as const, user: sessionUser };
}

function canEditArticle(createdBy: string | null, userId: string): boolean {
  return createdBy === userId;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireOrganizerAuthor();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const parsed = parseCmsDocumentId(id);
  if (!parsed || parsed.docType !== "author_article") {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const document = await getCmsDocumentById(admin, id);
  if (!document || document.body.kind !== "author_article") {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  if (!canEditArticle(document.createdBy, auth.user.id)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { data: moderation } = await admin
    .from("moderation_queue")
    .select("status, reason, updated_at")
    .eq("entity_type", "author_article")
    .eq("entity_id", document.id)
    .maybeSingle();

  return NextResponse.json({
    document,
    workflow: resolveAuthorArticleWorkflow(document, moderation),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireOrganizerAuthor();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const existing = await getCmsDocumentById(admin, id);
  if (!existing || existing.body.kind !== "author_article") {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }

  if (!canEditArticle(existing.createdBy, auth.user.id)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const input = (await request.json()) as {
    title?: string;
    excerpt?: string;
    sections?: CmsBlogSection[];
    seo?: CmsDocumentSeo;
    articleType?: CmsAuthorArticleType;
    relations?: CmsAuthorArticleRelations;
    expectedVersion?: number;
  };
  if (!Number.isInteger(input.expectedVersion) || (input.expectedVersion ?? 0) < 1) {
    return NextResponse.json(
      { error: "Статья уже могла измениться. Обновите страницу и повторите сохранение." },
      { status: 409 },
    );
  }

  const nextBody: CmsAuthorArticleBody = {
    ...existing.body,
    excerpt: input.excerpt ?? existing.body.excerpt,
    sections: input.sections ?? existing.body.sections,
    articleType: CMS_AUTHOR_ARTICLE_TYPES.includes(input.articleType as CmsAuthorArticleType)
      ? input.articleType
      : existing.body.articleType,
    relations: input.relations ?? existing.body.relations,
  };

  const result = await updateCmsDocument(admin, id, {
    title: input.title?.trim() || existing.title,
    body: nextBody,
    seo: input.seo ?? existing.seo,
    actorId: auth.user.id,
    expectedVersion: input.expectedVersion!,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.code === "STALE_VERSION" ? 409 : 400 });
  }

  return NextResponse.json({ document: result.document });
}
