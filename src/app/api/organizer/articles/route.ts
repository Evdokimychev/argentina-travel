import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { createCmsDocument, listCmsDocuments } from "@/lib/cms/content-server";
import { userHasAccountRole } from "@/types/user";
import type { CmsBlogSection } from "@/types/cms-content";

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

  return NextResponse.json({ articles: mine });
}

export async function POST(request: Request) {
  const auth = await requireOrganizerAuthor();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    title?: string;
    slug?: string;
    excerpt?: string;
    sections?: CmsBlogSection[];
  };

  const title = body.title?.trim() || "Черновик статьи";
  const slug = body.slug?.trim() || `article-${Date.now().toString(36)}`;

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
      sections: body.sections ?? [],
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
