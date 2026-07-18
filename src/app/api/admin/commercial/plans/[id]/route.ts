import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { isCommercialEntitlementKey } from "@/lib/commercial/entitlement-catalog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ACTION_FIELDS: Record<string, Set<string>> = {
  update: new Set(["action", "expectedVersion", "name", "description", "priceMinor", "currency", "billingPeriod"]),
  set_entitlement: new Set(["action", "expectedVersion", "entitlementKey", "enabled", "limitValue"]),
  activate: new Set(["action", "expectedVersion", "makeDefault"]),
  retire: new Set(["action", "expectedVersion"]),
};
const CURRENCIES = new Set(["USD", "RUB", "ARS", "EUR"]);
const BILLING_PERIODS = new Set(["none", "monthly", "yearly"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Изменения тарифов требуют личную сессию" }, { status: 403 });
  }
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Некорректный тариф" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const allowed = ACTION_FIELDS[action];
  if (!body || !allowed || Object.keys(body).some((key) => !allowed.has(key))) {
    return NextResponse.json({ error: "Неизвестное действие или поле" }, { status: 400 });
  }
  const expectedVersion = Number(body.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return NextResponse.json({ error: "Нужна актуальная версия записи" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  let result;
  if (action === "update") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : null;
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "";
    const billingPeriod = typeof body.billingPeriod === "string" ? body.billingPeriod : "";
    const priceMinor = body.priceMinor === null ? null : Number(body.priceMinor);
    if (
      name.length < 2 || name.length > 120 || !CURRENCIES.has(currency) ||
      !BILLING_PERIODS.has(billingPeriod) ||
      (priceMinor !== null && (!Number.isSafeInteger(priceMinor) || priceMinor < 0))
    ) {
      return NextResponse.json({ error: "Некорректные параметры тарифа" }, { status: 400 });
    }
    result = await supabase.rpc("commercial_update_draft_plan", {
      p_plan_id: id,
      p_expected_version: expectedVersion,
      p_name: name,
      p_description: description,
      p_price_minor: priceMinor,
      p_currency: currency,
      p_billing_period: billingPeriod,
      p_actor_user_id: auth.actorId,
    });
  } else if (action === "set_entitlement") {
    if (!isCommercialEntitlementKey(body.entitlementKey) || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Некорректное коммерческое право" }, { status: 400 });
    }
    const limitValue = body.limitValue === null || body.limitValue === undefined ? null : Number(body.limitValue);
    if (limitValue !== null && (!Number.isSafeInteger(limitValue) || limitValue < 0)) {
      return NextResponse.json({ error: "Некорректный лимит" }, { status: 400 });
    }
    result = await supabase.rpc("commercial_set_plan_entitlement", {
      p_plan_id: id,
      p_expected_version: expectedVersion,
      p_entitlement_key: body.entitlementKey,
      p_enabled: body.enabled,
      p_limit_value: limitValue,
      p_actor_user_id: auth.actorId,
    });
  } else if (action === "activate") {
    result = await supabase.rpc("commercial_activate_plan", {
      p_plan_id: id,
      p_expected_version: expectedVersion,
      p_make_default: body.makeDefault === true,
      p_actor_user_id: auth.actorId,
    });
  } else {
    result = await supabase.rpc("commercial_retire_plan", {
      p_plan_id: id,
      p_expected_version: expectedVersion,
      p_actor_user_id: auth.actorId,
    });
  }

  if (result.error || !result.data) {
    const conflict = /conflict|version/i.test(result.error?.message ?? "");
    return NextResponse.json(
      { error: conflict ? "Тариф уже изменён другим сотрудником" : result.error?.message ?? "Не удалось сохранить" },
      { status: conflict ? 409 : 400 }
    );
  }
  return NextResponse.json({ plan: result.data });
}
