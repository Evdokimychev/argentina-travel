import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { COMMERCIAL_ENTITLEMENT_CATALOG } from "@/lib/commercial/entitlement-catalog";
import type { Database } from "@/types/database";
import type {
  CommercialAdapter,
  CommercialAdapterStatus,
  CommercialAdapterType,
  CommercialBillingPeriod,
  CommercialEntitlementDecision,
  CommercialEntitlementDefinition,
  CommercialEntitlementKey,
  CommercialPlanStatus,
  CommercialPlanSummary,
  EntitlementGuardResult,
  OrganizerCommercialContract,
} from "@/types/commercial-entitlements";

type DbClient = SupabaseClient<Database>;
type PlanRow = Database["public"]["Tables"]["commercial_plans"]["Row"];
type SubscriptionRow =
  Database["public"]["Tables"]["organizer_commercial_subscriptions"]["Row"];
type GrantRow =
  Database["public"]["Tables"]["commercial_plan_entitlements"]["Row"];
type OverrideRow =
  Database["public"]["Tables"]["organizer_entitlement_overrides"]["Row"];

function mapPlan(row: PlanRow): CommercialPlanSummary {
  return {
    id: row.id,
    code: row.code,
    version: row.version,
    name: row.name,
    description: row.description,
    status: row.status as CommercialPlanStatus,
    isDefault: row.is_default,
    priceMinor: row.price_minor,
    currency: row.currency as CommercialPlanSummary["currency"],
    billingPeriod: row.billing_period as CommercialBillingPeriod,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function failClosedContract(
  organizerUserId: string,
  reason: OrganizerCommercialContract["denialReason"]
): OrganizerCommercialContract {
  const entitlements: Record<string, CommercialEntitlementDecision> = {};
  const adapters: OrganizerCommercialContract["adapters"] = {};

  for (const entry of COMMERCIAL_ENTITLEMENT_CATALOG) {
    entitlements[entry.key] = {
      key: entry.key,
      enabled: false,
      limit: entry.valueType === "limit" ? 0 : null,
      source: entry.adapter?.status === "future_disabled" ? "future_disabled" : "unavailable",
      reason:
        entry.adapter?.status === "future_disabled"
          ? "Адаптер зарезервирован для будущей разработки и принудительно отключён."
          : "Коммерческие права временно недоступны.",
      adapter: entry.adapter ?? null,
    };
    if (entry.adapter) {
      adapters[`${entry.adapter.type}.${entry.adapter.code}`] = {
        allowed: false,
        status: entry.adapter.status,
        reason:
          entry.adapter.status === "future_disabled"
            ? "Зарезервировано для будущей разработки."
            : "Коммерческие права недоступны.",
      };
    }
  }

  return {
    ok: false,
    organizerUserId,
    plan: null,
    subscription: null,
    entitlements,
    adapters,
    generatedAt: new Date().toISOString(),
    denialReason: reason,
  };
}

export type CommercialResolverSnapshot = {
  organizerUserId: string;
  adapters: CommercialAdapter[];
  definitions: CommercialEntitlementDefinition[];
  plan: PlanRow;
  subscription: SubscriptionRow | null;
  grants: Array<Pick<GrantRow, "entitlement_key" | "enabled" | "limit_value">>;
  overrides: OverrideRow[];
  generatedAt: string;
};

export function resolveCommercialSnapshot(
  snapshot: CommercialResolverSnapshot
): OrganizerCommercialContract {
  const {
    organizerUserId,
    adapters,
    definitions,
    plan,
    subscription,
    grants,
    overrides,
    generatedAt,
  } = snapshot;
  const adapterById = new Map(adapters.map((adapter) => [adapter.id, adapter]));
  const grantByKey = new Map(grants.map((row) => [row.entitlement_key, row]));
  const overrideByKey = new Map(overrides.map((row) => [row.entitlement_key, row]));
  const entitlements: Record<string, CommercialEntitlementDecision> = {};

  for (const definition of definitions) {
    const adapter = definition.adapterId
      ? adapterById.get(definition.adapterId) ?? null
      : null;
    const grant = grantByKey.get(definition.key);
    const override = overrideByKey.get(definition.key);
    let enabled = grant?.enabled ?? definition.defaultEnabled;
    let limit = grant?.limit_value ?? definition.defaultLimit;
    let source: CommercialEntitlementDecision["source"] = grant
      ? "plan"
      : "definition_default";
    let decisionReason = grant
      ? "Право предоставлено тарифом."
      : "Использовано безопасное значение по умолчанию.";

    if (override) {
      enabled = override.enabled ?? enabled;
      limit = override.limit_value ?? limit;
      source = "override";
      decisionReason = `Индивидуальное исключение: ${override.reason}`;
    }

    if (adapter && adapter.status !== "active") {
      enabled = false;
      limit = definition.valueType === "limit" ? 0 : null;
      source = adapter.status === "future_disabled" ? "future_disabled" : "unavailable";
      decisionReason =
        adapter.status === "future_disabled"
          ? "Адаптер зарезервирован для будущей разработки и принудительно отключён."
          : "Адаптер отключён платформой.";
    }

    entitlements[definition.key] = {
      key: definition.key,
      enabled,
      limit,
      source,
      reason: decisionReason,
      adapter: adapter
        ? { type: adapter.type, code: adapter.code, status: adapter.status }
        : null,
    };
  }

  const adapterDecisions: OrganizerCommercialContract["adapters"] = {};
  for (const adapter of adapters) {
    const related = Object.values(entitlements).filter(
      (decision) =>
        decision.adapter?.type === adapter.type && decision.adapter.code === adapter.code
    );
    const allowed = adapter.status === "active" && related.some((decision) => decision.enabled);
    adapterDecisions[`${adapter.type}.${adapter.code}`] = {
      allowed,
      status: adapter.status,
      reason:
        adapter.status === "future_disabled"
          ? "Зарезервировано для будущей разработки."
          : allowed
            ? "Разрешено действующим коммерческим контрактом."
            : "Текущий тариф не предоставляет доступ.",
    };
  }

  return {
    ok: true,
    organizerUserId,
    plan: mapPlan(plan),
    subscription: subscription
      ? {
          id: subscription.id,
          rowVersion: subscription.row_version,
          source: "subscription",
          startsAt: subscription.starts_at,
          endsAt: subscription.ends_at,
        }
      : {
          id: `default:${plan.id}`,
          rowVersion: plan.row_version,
          source: "default_plan",
          startsAt: plan.activated_at ?? plan.created_at,
          endsAt: null,
        },
    entitlements,
    adapters: adapterDecisions,
    generatedAt,
  };
}

export async function resolveOrganizerCommercialContract(
  supabase: DbClient,
  organizerUserId: string,
  now = new Date()
): Promise<OrganizerCommercialContract> {
  const nowIso = now.toISOString();
  const [adapterResult, definitionResult, subscriptionResult] = await Promise.all([
    supabase
      .from("commercial_adapters")
      .select("id, adapter_type, code, label, description, status")
      .order("adapter_type")
      .order("code"),
    supabase
      .from("commercial_entitlement_definitions")
      .select(
        "key, label, description, value_type, adapter_id, is_active, default_enabled, default_limit, hard_limit"
      )
      .eq("is_active", true)
      .order("key"),
    supabase
      .from("organizer_commercial_subscriptions")
      .select("*")
      .eq("organizer_user_id", organizerUserId)
      .eq("status", "active")
      .lte("starts_at", nowIso)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .limit(2),
  ]);

  if (adapterResult.error || definitionResult.error || subscriptionResult.error) {
    return failClosedContract(organizerUserId, "settings_unavailable");
  }
  if ((subscriptionResult.data ?? []).length > 1) {
    return failClosedContract(organizerUserId, "ambiguous_subscription");
  }

  const adapters: CommercialAdapter[] = (adapterResult.data ?? []).map((row) => ({
    id: row.id,
    type: row.adapter_type as CommercialAdapterType,
    code: row.code,
    label: row.label,
    description: row.description,
    status: row.status as CommercialAdapterStatus,
  }));
  const definitions: CommercialEntitlementDefinition[] = (definitionResult.data ?? []).map(
    (row) => ({
      key: row.key,
      label: row.label,
      description: row.description,
      valueType: row.value_type as CommercialEntitlementDefinition["valueType"],
      adapterId: row.adapter_id,
      defaultEnabled: row.default_enabled,
      defaultLimit: row.default_limit,
      hardLimit: row.hard_limit,
      isActive: row.is_active,
    })
  );

  const subscription = subscriptionResult.data?.[0] ?? null;
  let planResult;
  if (subscription) {
    planResult = await supabase
      .from("commercial_plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .in("status", ["active", "retired"])
      .maybeSingle();
  } else {
    const defaultResult = await supabase
      .from("commercial_plans")
      .select("*")
      .eq("status", "active")
      .eq("is_default", true)
      .limit(2);
    if (defaultResult.error || (defaultResult.data ?? []).length !== 1) {
      return failClosedContract(organizerUserId, "plan_unavailable");
    }
    planResult = { data: defaultResult.data![0], error: null };
  }

  if (planResult.error || !planResult.data) {
    return failClosedContract(organizerUserId, "plan_unavailable");
  }
  const plan = planResult.data;

  const [grantResult, overrideResult] = await Promise.all([
    supabase
      .from("commercial_plan_entitlements")
      .select("entitlement_key, enabled, limit_value")
      .eq("plan_id", plan.id),
    supabase
      .from("organizer_entitlement_overrides")
      .select("*")
      .eq("organizer_user_id", organizerUserId)
      .lte("starts_at", nowIso)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`),
  ]);
  if (grantResult.error || overrideResult.error) {
    return failClosedContract(organizerUserId, "settings_unavailable");
  }

  return resolveCommercialSnapshot({
    organizerUserId,
    adapters,
    definitions,
    plan,
    subscription,
    grants: grantResult.data ?? [],
    overrides: overrideResult.data ?? [],
    generatedAt: nowIso,
  });
}

export function guardOrganizerEntitlement(
  contract: OrganizerCommercialContract,
  key: CommercialEntitlementKey,
  currentUsage?: number
): EntitlementGuardResult {
  if (!contract.ok) {
    return { allowed: false, reason: "contract_unavailable", decision: null };
  }
  const decision = contract.entitlements[key] ?? null;
  if (!decision?.enabled) {
    return { allowed: false, reason: "not_entitled", decision };
  }
  if (
    currentUsage !== undefined &&
    decision.limit !== null &&
    currentUsage >= decision.limit
  ) {
    return { allowed: false, reason: "limit_reached", decision };
  }
  return { allowed: true, decision };
}
