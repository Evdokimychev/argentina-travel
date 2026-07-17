import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import {
  forumCategorySlug,
  validateForumCategoryDraft,
} from "@/lib/admin/forum-admin-contract";
import {
  fetchAdminForumOverview,
  mutateForumCategory,
} from "@/lib/admin/forum-admin-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function authorizeOwner(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth;
  if (auth.via !== "session" || !UUID.test(auth.actorId)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Для управления форумом войдите в административную учётную запись" },
        { status: 403 },
      ),
    };
  }
  return auth;
}

export async function GET(request: Request) {
  const auth = await authorizeOwner(request);
  if (!auth.ok) return auth.response;
  try {
    const overview = await fetchAdminForumOverview();
    return NextResponse.json(overview, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить форум. Попробуйте обновить страницу." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authorizeOwner(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const validation = validateForumCategoryDraft(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const result = await mutateForumCategory({
    action: "create",
    actorId: auth.actorId,
    categoryId: null,
    expectedUpdatedAt: null,
    slug: forumCategorySlug(validation.value.title),
    draft: validation.value,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await authorizeOwner(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== "string" || !UUID.test(body.id)) {
    return NextResponse.json({ error: "Некорректный раздел" }, { status: 400 });
  }
  if (
    typeof body.expectedUpdatedAt !== "string"
    || !Number.isFinite(Date.parse(body.expectedUpdatedAt))
  ) {
    return NextResponse.json({ error: "Обновите страницу перед сохранением" }, { status: 400 });
  }
  const validation = validateForumCategoryDraft(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const result = await mutateForumCategory({
    action: "update",
    actorId: auth.actorId,
    categoryId: body.id,
    expectedUpdatedAt: body.expectedUpdatedAt,
    slug: "unchanged",
    draft: validation.value,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authorizeOwner(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (
    !body
    || typeof body.id !== "string"
    || !UUID.test(body.id)
    || typeof body.expectedUpdatedAt !== "string"
    || !Number.isFinite(Date.parse(body.expectedUpdatedAt))
  ) {
    return NextResponse.json({ error: "Некорректный раздел" }, { status: 400 });
  }
  const result = await mutateForumCategory({
    action: "delete",
    actorId: auth.actorId,
    categoryId: body.id,
    expectedUpdatedAt: body.expectedUpdatedAt,
    slug: "unused",
    draft: {
      title: "Удаляемый раздел",
      description: null,
      sortOrder: 0,
      publicRead: false,
      isActive: false,
    },
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
