import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { getCmsDocumentById, updateCmsDocument } from "@/lib/cms/content-server";
import { parseCmsDocumentId } from "@/types/cms-content";
import { userHasAccountRole } from "@/types/user";
import type { CmsAuthorArticleBody, CmsBlogSection, CmsDocumentSeo } from "@/types/cms-content";

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

  return NextResponse.json({ document });
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
  };

  const nextBody: CmsAuthorArticleBody = {
    ...existing.body,
    excerpt: input.excerpt ?? existing.body.excerpt,
    sections: input.sections ?? existing.body.sections,
  };

  const result = await updateCmsDocument(admin, id, {
    title: input.title?.trim() || existing.title,
    body: nextBody,
    seo: input.seo ?? existing.seo,
    actorId: auth.user.id,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ document: result.document });
}
