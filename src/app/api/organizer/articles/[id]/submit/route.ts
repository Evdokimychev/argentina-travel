import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { getCmsDocumentById } from "@/lib/cms/content-server";
import { userHasAccountRole } from "@/types/user";
import type { Json } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const user = await loadSessionUserFromSupabase(supabase);
  if (!user || !userHasAccountRole(user, "organizer")) {
    return NextResponse.json({ error: "Требуется роль организатора" }, { status: 403 });
  }

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const document = await getCmsDocumentById(admin, id);
  if (!document || document.body.kind !== "author_article") {
    return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
  }
  if (document.createdBy !== user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  if (document.status === "published" || document.status === "scheduled") {
    return NextResponse.json(
      { error: "Опубликованный материал обновляется через новую редакцию" },
      { status: 409 },
    );
  }

  const hasContent = (document.body.sections ?? []).some(
    (section) => section.title.trim().length >= 3 && section.body.trim().length >= 40,
  );
  const validationErrors = [
    document.title.trim().length < 8 ? "Укажите понятный заголовок" : null,
    (document.body.excerpt?.trim().length ?? 0) < 40
      ? "Добавьте краткое описание не короче 40 символов"
      : null,
    !hasContent ? "Добавьте хотя бы один содержательный блок" : null,
  ].filter((item): item is string => Boolean(item));

  if (validationErrors.length) {
    return NextResponse.json(
      { error: "Статья пока не готова к проверке", validationErrors },
      { status: 400 },
    );
  }

  const { data, error } = await admin
    .from("moderation_queue")
    .upsert(
      {
        entity_type: "author_article",
        entity_id: document.id,
        status: "pending",
        submitted_by: user.id,
        reason: "Статья отправлена на редакционную проверку",
        metadata: {
          title: document.title,
          slug: document.slug,
          ownerUserId: user.id,
          articleType: document.body.articleType ?? "story",
        } as Json,
        resolved_at: null,
        resolved_by: null,
      },
      { onConflict: "entity_type,entity_id" },
    )
    .select("status, reason, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Не удалось отправить статью. Попробуйте ещё раз." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    workflow: {
      status: "in_review",
      note: data.reason,
      updatedAt: data.updated_at,
    },
  });
}
