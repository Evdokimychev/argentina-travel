import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { isCommercialEntitlementKey } from "@/lib/commercial/entitlement-catalog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ACTION_FIELDS: Record<string, Set<string>> = {
  assign: new Set(["action", "organizerUserId", "planId", "expectedVersion", "startsAt", "endsAt"]),
  set_override: new Set([
    "action",
    "organizerUserId",
    "entitlementKey",
    "enabled",
    "limitValue",
    "reason",
    "endsAt",
    "expectedVersion",
  ]),
  delete_override: new Set(["action", "overrideId", "expectedVersion"]),
};

function optionalIso(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;
  const organizerUserId = new URL(request.url).searchParams.get("organizerUserId");
  if (!isUuid(organizerUserId)) {
    return NextResponse.json({ error: "Некорректный организатор" }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  const [subscriptions, overrides] = await Promise.all([
    supabase
      .from("organizer_commercial_subscriptions")
      .select("*")
      .eq("organizer_user_id", organizerUserId)
      .order("created_at", { ascending: false }),
    supabase
      .from("organizer_entitlement_overrides")
      .select("*")
      .eq("organizer_user_id", organizerUserId)
      .order("entitlement_key"),
  ]);
  const error = subscriptions.error ?? overrides.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscriptions: subscriptions.data ?? [], overrides: overrides.data ?? [] });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Назначение тарифа требует личную сессию" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const allowed = ACTION_FIELDS[action];
  if (!body || !allowed || Object.keys(body).some((key) => !allowed.has(key))) {
    return NextResponse.json({ error: "Неизвестное действие или поле" }, { status: 400 });
  }
  const expectedVersion = Number(body.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    return NextResponse.json({ error: "Некорректная версия записи" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (action === "assign") {
    if (!isUuid(body.organizerUserId) || !isUuid(body.planId)) {
      return NextResponse.json({ error: "Некорректный организатор или тариф" }, { status: 400 });
    }
    const startsAt = optionalIso(body.startsAt);
    const endsAt = optionalIso(body.endsAt);
    if (startsAt === undefined || endsAt === undefined) {
      return NextResponse.json({ error: "Некорректный период подписки" }, { status: 400 });
    }
    const { data, error } = await supabase.rpc("commercial_assign_organizer_plan", {
      p_organizer_user_id: body.organizerUserId,
      p_plan_id: body.planId,
      p_expected_subscription_version: expectedVersion,
      p_starts_at: startsAt,
      p_ends_at: endsAt,
      p_actor_user_id: auth.actorId,
    });
    if (error || !data) {
      const conflict = /conflict|version/i.test(error?.message ?? "");
      return NextResponse.json(
        { error: conflict ? "Подписка уже изменена другим сотрудником" : error?.message ?? "Не удалось назначить тариф" },
        { status: conflict ? 409 : 400 }
      );
    }
    return NextResponse.json({ subscription: data });
  }

  if (action === "set_override") {
    if (!isUuid(body.organizerUserId) || !isCommercialEntitlementKey(body.entitlementKey)) {
      return NextResponse.json({ error: "Некорректный организатор или право" }, { status: 400 });
    }
    const enabled = typeof body.enabled === "boolean" ? body.enabled : null;
    const limitValue = body.limitValue === null || body.limitValue === undefined ? null : Number(body.limitValue);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const endsAt = optionalIso(body.endsAt);
    if (
      (enabled === null && limitValue === null) ||
      (limitValue !== null && (!Number.isSafeInteger(limitValue) || limitValue < 0)) ||
      reason.length < 3 || reason.length > 1000 || endsAt === undefined
    ) {
      return NextResponse.json({ error: "Проверьте значение, причину и срок исключения" }, { status: 400 });
    }
    const { data, error } = await supabase.rpc("commercial_upsert_organizer_override", {
      p_organizer_user_id: body.organizerUserId,
      p_entitlement_key: body.entitlementKey,
      p_enabled: enabled,
      p_limit_value: limitValue,
      p_reason: reason,
      p_ends_at: endsAt,
      p_expected_version: expectedVersion,
      p_actor_user_id: auth.actorId,
    });
    if (error || !data) {
      const conflict = /conflict|version/i.test(error?.message ?? "");
      return NextResponse.json(
        { error: conflict ? "Исключение уже изменено другим сотрудником" : error?.message ?? "Не удалось сохранить исключение" },
        { status: conflict ? 409 : 400 }
      );
    }
    return NextResponse.json({ override: data });
  }

  if (!isUuid(body.overrideId) || expectedVersion < 1) {
    return NextResponse.json({ error: "Некорректное исключение" }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("commercial_delete_organizer_override", {
    p_override_id: body.overrideId,
    p_expected_version: expectedVersion,
    p_actor_user_id: auth.actorId,
  });
  if (error || !data) {
    const conflict = /conflict|version/i.test(error?.message ?? "");
    return NextResponse.json(
      { error: conflict ? "Исключение уже изменено другим сотрудником" : error?.message ?? "Не удалось удалить исключение" },
      { status: conflict ? 409 : 400 }
    );
  }
  return NextResponse.json({ deletedId: data });
}
