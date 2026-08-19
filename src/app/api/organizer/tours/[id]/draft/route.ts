import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createMinimalTourFromDraft, organizerDraftToTour } from "@/lib/tour-mapper";
import { rowToTour, tourToContentRow } from "@/lib/tour-content-mapper";
import { getCatalogSlug } from "@/lib/tour-slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { OrganizerTourDraft } from "@/types/organizer-tour";
import type { Tour } from "@/types/tour";
import { userHasAccountRole } from "@/types/user";
import { evaluatePublishReadiness } from "@/lib/publish-readiness";
import type { OrganizerTourModerationStatus, OrganizerTourType } from "@/types/organizer-tour";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { PRIMARY_PUBLIC_MARKET } from "@/lib/market-context";
import type { Json } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

interface PatchBody {
  draft?: OrganizerTourDraft;
  expectedUpdatedAt?: string | null;
}

const MAX_DRAFT_BYTES = 1_000_000;
const ORGANIZER_PRODUCTS_BUCKET = "organizer-products";

function isSafeMediaUrl(value: string): boolean {
  if (!value) return true;
  if (value.length > 2_048 || value.startsWith("data:")) return false;
  return value.startsWith("/") || value.startsWith("https://");
}

function containsEmbeddedDataUrl(value: unknown, depth = 0): boolean {
  if (depth > 20) return true;
  if (typeof value === "string") return /^data:/i.test(value.trim());
  if (Array.isArray(value)) {
    return value.some((item) => containsEmbeddedDataUrl(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => containsEmbeddedDataUrl(item, depth + 1));
  }
  return false;
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function isSameRevision(serverUpdatedAt: string, expectedUpdatedAt: string | null): boolean {
  const serverTs = toTimestamp(serverUpdatedAt);
  const expectedTs = toTimestamp(expectedUpdatedAt);
  return serverTs != null && expectedTs != null && serverTs === expectedTs;
}

type AtomicTourMutationResult = {
  id: string;
  rowVersion: number;
  updatedAt: string;
  status: string;
  moderationStatus: string;
  moderationNotes: string | null;
};

function parseAtomicMutationResult(value: Json): AtomicTourMutationResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, Json | undefined>;
  if (
    typeof row.id !== "string" ||
    typeof row.rowVersion !== "number" ||
    typeof row.updatedAt !== "string" ||
    typeof row.status !== "string" ||
    typeof row.moderationStatus !== "string"
  ) {
    return null;
  }
  return {
    id: row.id,
    rowVersion: row.rowVersion,
    updatedAt: row.updatedAt,
    status: row.status,
    moderationStatus: row.moderationStatus,
    moderationNotes: typeof row.moderationNotes === "string" ? row.moderationNotes : null,
  };
}

function atomicMutationErrorResponse(message: string, serverUpdatedAt?: string | null) {
  if (message.includes("TOUR_VERSION_CONFLICT")) {
    return NextResponse.json(
      { error: "Черновик уже обновлён в другом сеансе", serverUpdatedAt: serverUpdatedAt ?? null },
      { status: 409 }
    );
  }
  if (message.includes("TOUR_SLUG_CONFLICT")) {
    return NextResponse.json(
      { error: "Такой адрес страницы уже занят. Измените название предложения." },
      { status: 409 }
    );
  }
  if (message.includes("TOUR_ACTIVE_OFFER_LIMIT_REACHED")) {
    return NextResponse.json(
      { error: "Достигнут лимит активных предложений по вашему тарифу. Архивируйте предложение или измените тариф." },
      { status: 409 }
    );
  }
  if (
    message.includes("TOUR_MODULE_NOT_ENTITLED") ||
    message.includes("TOUR_MARKET_NOT_ENTITLED") ||
    message.includes("TOUR_ACTIVE_OFFER_LIMIT_DISABLED")
  ) {
    return NextResponse.json(
      { error: "Текущий тариф не разрешает это действие. Проверьте доступные возможности тарифа." },
      { status: 403 }
    );
  }
  if (message.includes("TOUR_COMMERCIAL_CONTRACT_UNAVAILABLE")) {
    return NextResponse.json(
      { error: "Не удалось безопасно проверить возможности тарифа. Повторите попытку позже." },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { error: "Не удалось сохранить предложение. Повторите попытку позже." },
    { status: 500 }
  );
}

async function requireOrganizer() {
  if (!isSupabaseToursEnabled()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Синхронизация туров недоступна" }, { status: 503 }),
    };
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }),
    };
  }

  return { ok: true as const, supabase, sessionUser };
}

function resolveBaseTour(draft: OrganizerTourDraft, existingTour: Tour | null): Tour {
  const catalogSlug = getCatalogSlug(draft);
  const base = existingTour ?? createMinimalTourFromDraft(draft, catalogSlug);

  return {
    ...base,
    id: base.id.startsWith("org-") ? draft.id : base.id,
    slug: catalogSlug,
    organizerTourId: draft.id,
  };
}

function parseModerationStatus(value: string): OrganizerTourModerationStatus {
  return value === "pending" || value === "approved" || value === "rejected"
    ? value
    : "none";
}

function parseStoredDraft(
  value: unknown,
  fallback: {
    ownerUserId: string;
    marketCode: string;
    rowVersion: number;
    productType: string;
    status: string;
    moderationStatus: string;
    moderationNotes: string | null;
    updatedAt: string;
  }
): OrganizerTourDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<OrganizerTourDraft>;
  if (!candidate.id || !candidate.title) return null;

  return {
    ...candidate,
    ownerUserId: fallback.ownerUserId,
    marketId: fallback.marketCode,
    rowVersion: fallback.rowVersion,
    type: fallback.productType === "excursion" ? "excursion" : "tour",
    status: fallback.status === "published" ? "published" : "draft",
    archived: fallback.status === "archived" || Boolean(candidate.archived),
    moderationStatus: parseModerationStatus(fallback.moderationStatus),
    moderationNotes: fallback.moderationNotes,
    updatedAt: fallback.updatedAt,
  } as OrganizerTourDraft;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireOrganizer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const { data, error } = await auth.supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Не удалось загрузить предложение. Повторите попытку позже." },
      { status: 503 }
    );
  }

  if (!data || data.owner_user_id !== auth.sessionUser.id) {
    return NextResponse.json({ error: "Предложение не найдено" }, { status: 404 });
  }

  return NextResponse.json({
    updatedAt: data.updated_at,
    rowVersion: data.row_version,
    tour: rowToTour(data),
    draft: parseStoredDraft(data.editor_draft, {
      ownerUserId: data.owner_user_id,
      marketCode: data.market_code,
      rowVersion: data.row_version,
      productType: data.product_type,
      status: data.status,
      moderationStatus: data.moderation_status,
      moderationNotes: data.moderation_notes,
      updatedAt: data.updated_at,
    }),
    moderationStatus: parseModerationStatus(data.moderation_status),
    moderationNotes: data.moderation_notes,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireOrganizer();
  if (!auth.ok) return auth.response;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_DRAFT_BYTES) {
    return NextResponse.json({ error: "Черновик слишком большой" }, { status: 413 });
  }

  const { id } = await context.params;
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const draft = body.draft ?? null;
  const expectedUpdatedAt =
    typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : null;

  if (!draft || typeof draft !== "object" || Array.isArray(draft) || draft.id !== id) {
    return NextResponse.json({ error: "Некорректный идентификатор предложения" }, { status: 400 });
  }

  if (JSON.stringify(draft).length > MAX_DRAFT_BYTES) {
    return NextResponse.json({ error: "Черновик слишком большой" }, { status: 413 });
  }
  if (containsEmbeddedDataUrl(draft)) {
    return NextResponse.json(
      { error: "Загрузите изображения через редактор, а не сохраняйте их внутри черновика" },
      { status: 400 }
    );
  }

  if (typeof draft.title !== "string" || !draft.title.trim()) {
    return NextResponse.json({ error: "Укажите название предложения" }, { status: 400 });
  }
  if (draft.title.trim().length > 120) {
    return NextResponse.json({ error: "Название слишком длинное" }, { status: 400 });
  }
  if (
    !Array.isArray(draft.gallery) ||
    !Array.isArray(draft.accommodationPhotos) ||
    !Array.isArray(draft.programDays) ||
    !Array.isArray(draft.groupTourDates)
  ) {
    return NextResponse.json({ error: "Некорректная структура черновика" }, { status: 400 });
  }
  if (draft.gallery.length > 30 || draft.programDays.length > 60 || draft.groupTourDates.length > 200) {
    return NextResponse.json({ error: "В черновике превышено допустимое число элементов" }, { status: 400 });
  }
  if (![draft.image, draft.routeMapImage, ...draft.gallery, ...draft.accommodationPhotos].every(isSafeMediaUrl)) {
    return NextResponse.json(
      { error: "Загрузите изображения через редактор, а не вставляйте данные файла в черновик" },
      { status: 400 }
    );
  }

  const productType: OrganizerTourType = draft.type === "excursion" ? "excursion" : "tour";
  const catalogSlug = getCatalogSlug(draft);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(catalogSlug)) {
    return NextResponse.json({ error: "Некорректный адрес страницы" }, { status: 400 });
  }

  const { data: existingRow, error: existingError } = await auth.supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "Не удалось проверить предложение. Повторите попытку позже." },
      { status: 503 }
    );
  }

  if (existingRow && existingRow.owner_user_id !== auth.sessionUser.id) {
    return NextResponse.json({ error: "Предложение не найдено" }, { status: 404 });
  }

  if (existingRow && existingRow.product_type !== productType) {
    return NextResponse.json(
      { error: "Тип предложения нельзя изменить после создания" },
      { status: 400 }
    );
  }

  if (!existingRow && draft.ownerUserId && draft.ownerUserId !== auth.sessionUser.id) {
    return NextResponse.json({ error: "Предложение не найдено" }, { status: 404 });
  }

  if (existingRow && !isSameRevision(existingRow.updated_at, expectedUpdatedAt)) {
    return NextResponse.json(
      {
        error: "Черновик уже обновлён в другом сеансе",
        serverUpdatedAt: existingRow.updated_at,
      },
      { status: 409 }
    );
  }

  const { data: slugOwner, error: slugError } = await auth.supabase
    .from("tours")
    .select("id, owner_user_id")
    .eq("slug", catalogSlug)
    .neq("id", id)
    .maybeSingle();

  if (slugError) {
    return NextResponse.json(
      { error: "Не удалось проверить адрес страницы. Повторите попытку позже." },
      { status: 503 }
    );
  }
  if (slugOwner) {
    return NextResponse.json(
      { error: "Такой адрес страницы уже занят. Измените название предложения." },
      { status: 409 }
    );
  }

  const serverDraft: OrganizerTourDraft = {
    ...draft,
    id,
    ownerUserId: auth.sessionUser.id,
    type: productType,
    slug: catalogSlug,
    catalogSlug,
    marketId:
      typeof draft.marketId === "string" && /^[a-z][a-z0-9_-]{1,31}$/.test(draft.marketId)
        ? draft.marketId
        : PRIMARY_PUBLIC_MARKET.id,
    rowVersion: existingRow?.row_version ?? 0,
  };

  if (serverDraft.status === "published" && !serverDraft.archived) {
    const readiness = evaluatePublishReadiness(serverDraft);
    if (!readiness.ready) {
      return NextResponse.json(
        { error: readiness.blockingMessage ?? "Заполните обязательные поля перед публикацией" },
        { status: 422 }
      );
    }
  }

  const existingTour = existingRow ? rowToTour(existingRow) : null;
  const base = resolveBaseTour(serverDraft, existingTour);
  const canonical = organizerDraftToTour(serverDraft, base);
  const canonicalRow = tourToContentRow(canonical, auth.sessionUser.id);
  const operation = serverDraft.archived
    ? "archive"
    : serverDraft.status === "published"
      ? "submit"
      : "save";
  const admin = createSupabaseAdminClient();
  const { data: mutationData, error: mutationError } = await admin.rpc(
    "organizer_mutate_tour_atomic",
    {
      p_tour_id: canonical.id,
      p_actor_user_id: auth.sessionUser.id,
      p_expected_version: existingRow?.row_version ?? 0,
      p_operation: operation,
      p_market_code: serverDraft.marketId ?? PRIMARY_PUBLIC_MARKET.id,
      p_product_type: productType,
      p_slug: canonical.slug,
      p_title: canonical.title,
      p_listing: canonicalRow.listing ?? {},
      p_payload: canonicalRow.payload,
      p_editor_draft: serverDraft as unknown as Json,
      p_ip_address: clientIpFromRequest(request),
    }
  );
  if (mutationError) {
    let latestUpdatedAt = existingRow?.updated_at ?? null;
    if (mutationError.message.includes("TOUR_VERSION_CONFLICT")) {
      const { data: latest } = await auth.supabase
        .from("tours")
        .select("updated_at")
        .eq("id", id)
        .maybeSingle();
      latestUpdatedAt = latest?.updated_at ?? latestUpdatedAt;
    }
    return atomicMutationErrorResponse(mutationError.message, latestUpdatedAt);
  }
  const persisted = parseAtomicMutationResult(mutationData);
  if (!persisted) {
    return NextResponse.json(
      { error: "Не удалось подтвердить сохранение предложения. Повторите попытку позже." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    updatedAt: persisted.updatedAt,
    rowVersion: persisted.rowVersion,
    moderationStatus: parseModerationStatus(persisted.moderationStatus),
    moderationNotes: persisted.moderationNotes,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireOrganizer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const { data: existing, error: existingError } = await auth.supabase
    .from("tours")
    .select("owner_user_id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "Не удалось проверить предложение. Повторите попытку позже." },
      { status: 503 }
    );
  }
  if (!existing) {
    return NextResponse.json({ ok: true });
  }
  if (existing.owner_user_id !== auth.sessionUser.id) {
    return NextResponse.json({ error: "Предложение не найдено" }, { status: 404 });
  }

  const { error } = await auth.supabase
    .from("tours")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", auth.sessionUser.id);

  if (error) {
    return NextResponse.json(
      { error: "Не удалось удалить предложение. Повторите попытку позже." },
      { status: 500 }
    );
  }

  const storagePrefix = `${auth.sessionUser.id}/${id}`;
  const admin = createSupabaseAdminClient();
  const { data: storedFiles } = await admin.storage
    .from(ORGANIZER_PRODUCTS_BUCKET)
    .list(storagePrefix, { limit: 100 });
  if (storedFiles?.length) {
    await admin.storage
      .from(ORGANIZER_PRODUCTS_BUCKET)
      .remove(storedFiles.map((file) => `${storagePrefix}/${file.name}`));
  }

  await admin
    .from("moderation_queue")
    .update({
      status: "cancelled",
      resolved_at: new Date().toISOString(),
      resolved_by: null,
    })
    .eq("entity_type", "tour")
    .eq("entity_id", id)
    .in("status", ["pending", "in_review"]);

  return NextResponse.json({ ok: true });
}
