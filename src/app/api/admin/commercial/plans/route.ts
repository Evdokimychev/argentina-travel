import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_CREATE_FIELDS = new Set([
  "code",
  "name",
  "description",
  "priceMinor",
  "currency",
  "billingPeriod",
  "cloneFromPlanId",
]);
const CURRENCIES = new Set(["USD", "RUB", "ARS", "EUR"]);
const BILLING_PERIODS = new Set(["none", "monthly", "yearly"]);

function hasUnknownFields(value: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(value).some((key) => !allowed.has(key));
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const [plans, definitions, adapters, grants] = await Promise.all([
    supabase.from("commercial_plans").select("*").order("code").order("version", { ascending: false }),
    supabase.from("commercial_entitlement_definitions").select("*").order("key"),
    supabase.from("commercial_adapters").select("*").order("adapter_type").order("code"),
    supabase.from("commercial_plan_entitlements").select("*").order("entitlement_key"),
  ]);
  const error = plans.error ?? definitions.error ?? adapters.error ?? grants.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    plans: plans.data ?? [],
    definitions: definitions.data ?? [],
    adapters: adapters.data ?? [],
    grants: grants.data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Изменения тарифов требуют личную сессию" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body) || hasUnknownFields(body, ALLOWED_CREATE_FIELDS)) {
    return NextResponse.json({ error: "Тело запроса содержит неизвестные поля" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "USD";
  const billingPeriod = typeof body.billingPeriod === "string" ? body.billingPeriod : "none";
  const priceMinor = body.priceMinor === null ? null : Number(body.priceMinor);
  const cloneFromPlanId = typeof body.cloneFromPlanId === "string" ? body.cloneFromPlanId : null;

  if (!/^[a-z][a-z0-9_-]{1,39}$/.test(code) || name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Проверьте код и название тарифа" }, { status: 400 });
  }
  if (!CURRENCIES.has(currency) || !BILLING_PERIODS.has(billingPeriod)) {
    return NextResponse.json({ error: "Некорректная валюта или период" }, { status: 400 });
  }
  if (priceMinor !== null && (!Number.isSafeInteger(priceMinor) || priceMinor < 0)) {
    return NextResponse.json({ error: "Цена должна быть целым числом в минимальных единицах" }, { status: 400 });
  }
  if (cloneFromPlanId && !isUuid(cloneFromPlanId)) {
    return NextResponse.json({ error: "Некорректный тариф-источник" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("commercial_create_plan_version", {
    p_code: code,
    p_name: name,
    p_description: description,
    p_price_minor: priceMinor,
    p_currency: currency,
    p_billing_period: billingPeriod,
    p_clone_from_plan_id: cloneFromPlanId,
    p_actor_user_id: auth.actorId,
  });
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Не удалось создать тариф" }, { status: 400 });
  }
  return NextResponse.json({ plan: data }, { status: 201 });
}
