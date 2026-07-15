import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { createCmsDocument, listCmsDocuments } from "@/lib/cms/content-server";
import { userHasAccountRole } from "@/types/user";
import type { CmsBlogSection } from "@/types/cms-content";
import {
  CMS_AUTHOR_ARTICLE_TYPES,
  type CmsAuthorArticleType,
} from "@/types/cms-content";
import { resolveAuthorArticleWorkflow } from "@/lib/cms/author-article-workflow";

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

export async function GET() {
  const auth = await requireOrganizerAuthor();
  if (!auth.ok) return auth.response;

  const admin = createSupabaseAdminClient();
  const documents = await listCmsDocuments(admin, { docType: "author_article" });
  const mine = documents.filter((doc) => doc.createdBy === auth.user.id);
  const ids = mine.map((document) => document.id);
  const { data: moderationRows } = ids.length
    ? await admin
        .from("moderation_queue")
        .select("entity_id, status, reason, updated_at")
        .eq("entity_type", "author_article")
        .in("entity_id", ids)
    : { data: [] };
  const moderationById = new Map(
    (moderationRows ?? []).map((row) => [row.entity_id, row]),
  );
  const workflows = Object.fromEntries(
    mine.map((document) => [
      document.id,
      resolveAuthorArticleWorkflow(document, moderationById.get(document.id)),
    ]),
  );

  return NextResponse.json({ articles: mine, workflows });
}

export async function POST(request: Request) {
  const auth = await requireOrganizerAuthor();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    title?: string;
    slug?: string;
    excerpt?: string;
    sections?: CmsBlogSection[];
    articleType?: CmsAuthorArticleType;
  };

  const title = body.title?.trim() || "Черновик статьи";
  const slug = body.slug?.trim() || `article-${Date.now().toString(36)}`;
  const articleType = CMS_AUTHOR_ARTICLE_TYPES.includes(body.articleType as CmsAuthorArticleType)
    ? body.articleType
    : "story";

  const admin = createSupabaseAdminClient();
  const result = await createCmsDocument(admin, {
    docType: "author_article",
    slug,
    locale: "ru",
    title,
    body: {
      kind: "author_article",
      excerpt: body.excerpt?.trim() || "",
      authorName: auth.user.fullName ?? auth.user.email ?? undefined,
      articleType,
      sections: body.sections ?? [
        {
          title: "О чём этот материал",
          body: "Расскажите читателю, что он узнает и почему этому опыту можно доверять.",
        },
      ],
    },
    seo: { description: body.excerpt?.trim() || title },
    status: "draft",
    actorId: auth.user.id,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ document: result.document }, { status: 201 });
}
