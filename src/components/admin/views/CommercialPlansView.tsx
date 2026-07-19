"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Boxes, RefreshCcw, ShieldCheck } from "lucide-react";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { OrganizerCommercialContract } from "@/types/commercial-entitlements";

type PlanRow = {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string | null;
  status: "draft" | "active" | "retired";
  is_default: boolean;
  price_minor: number | null;
  currency: string;
  billing_period: string;
  row_version: number;
};

type DefinitionRow = {
  key: string;
  label: string;
  description: string | null;
  value_type: "boolean" | "limit";
  adapter_id: string | null;
  hard_limit: number | null;
};

type AdapterRow = {
  id: string;
  adapter_type: string;
  code: string;
  label: string;
  status: "active" | "future_disabled" | "retired";
};

type GrantRow = {
  plan_id: string;
  entitlement_key: string;
  enabled: boolean;
  limit_value: number | null;
};

type CommercialData = {
  plans: PlanRow[];
  definitions: DefinitionRow[];
  adapters: AdapterRow[];
  grants: GrantRow[];
};

type OverrideRow = {
  id: string;
  entitlement_key: string;
  enabled: boolean | null;
  limit_value: number | null;
  reason: string;
  row_version: number;
};

type DraftPlanEdit = {
  name: string;
  description: string;
  priceMajor: string;
  currency: string;
  billingPeriod: string;
};

type OrganizerOption = {
  id: string;
  fullName: string;
  email: string | null;
};

const STATUS_LABELS = { draft: "Черновик", active: "Активен", retired: "Архив" } as const;
const CURRENCIES = ["USD", "RUB", "ARS", "EUR"] as const;
const DENIAL_REASON_LABELS: Record<string, string> = {
  settings_unavailable: "Не удалось подтвердить настройки тарифов.",
  plan_unavailable: "Для организатора пока не найден действующий тариф.",
  ambiguous_subscription: "Найдено несколько действующих назначений. Требуется проверка администратора.",
};

function formatMajorPrice(priceMinor: number | null): string {
  return priceMinor === null ? "" : (priceMinor / 100).toFixed(2);
}

function parseMinorPrice(priceMajor: string): number | null {
  if (!priceMajor.trim()) return null;
  const parsed = Number(priceMajor.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

export default function CommercialPlansView() {
  const [data, setData] = useState<CommercialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [cloneFromPlanId, setCloneFromPlanId] = useState("");
  const [organizerUserId, setOrganizerUserId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [contract, setContract] = useState<OrganizerCommercialContract | null>(null);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [overrideKey, setOverrideKey] = useState("analytics.advanced");
  const [overrideEnabled, setOverrideEnabled] = useState("true");
  const [overrideLimit, setOverrideLimit] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [draftLimits, setDraftLimits] = useState<Record<string, string>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, DraftPlanEdit>>({});
  const [organizers, setOrganizers] = useState<OrganizerOption[]>([]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/commercial/plans", { cache: "no-store" });
      const payload = (await response.json()) as CommercialData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не удалось загрузить тарифы");
      setData(payload);
      setSelectedPlanId((current) => current || payload.plans.find((plan) => plan.status === "active")?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить тарифы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    let cancelled = false;
    async function loadOrganizers() {
      try {
        const response = await fetch("/api/admin/users?role=organizer&status=active", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { users?: OrganizerOption[] };
        if (!cancelled) setOrganizers(payload.users ?? []);
      } catch {
        // The assignment section stays unavailable when the user list cannot be read.
      }
    }
    void loadOrganizers();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createPlan() {
    setBusy("create");
    setError(null);
    try {
      const response = await fetch("/api/admin/commercial/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          description: "",
          priceMinor: null,
          currency: "USD",
          billingPeriod: "monthly",
          cloneFromPlanId: cloneFromPlanId || null,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не удалось создать версию");
      setMessage("Черновик новой версии создан. Проверьте права перед активацией.");
      setNewCode("");
      setNewName("");
      await loadPlans();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать версию");
    } finally {
      setBusy(null);
    }
  }

  async function patchPlan(plan: PlanRow, body: Record<string, unknown>, success: string) {
    setBusy(`${plan.id}:${String(body.action)}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/commercial/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, expectedVersion: plan.row_version }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не удалось сохранить тариф");
      setMessage(success);
      await loadPlans();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить тариф");
    } finally {
      setBusy(null);
    }
  }

  function confirmPlanChange(
    plan: PlanRow,
    body: Record<string, unknown>,
    success: string,
    question: string,
  ) {
    if (!window.confirm(question)) return;
    void patchPlan(plan, body, success);
  }

  async function previewOrganizer() {
    const id = organizerUserId.trim();
    if (!id) return;
    setBusy("preview");
    setError(null);
    try {
      const [previewResponse, subscriptionResponse] = await Promise.all([
        fetch(`/api/admin/commercial/preview?organizerUserId=${encodeURIComponent(id)}`, { cache: "no-store" }),
        fetch(`/api/admin/commercial/subscriptions?organizerUserId=${encodeURIComponent(id)}`, { cache: "no-store" }),
      ]);
      const previewPayload = (await previewResponse.json()) as { contract?: OrganizerCommercialContract; error?: string };
      const subscriptionPayload = (await subscriptionResponse.json()) as { overrides?: OverrideRow[]; error?: string };
      if (!previewResponse.ok) throw new Error(previewPayload.error ?? "Не удалось собрать предпросмотр");
      if (!subscriptionResponse.ok) throw new Error(subscriptionPayload.error ?? "Не удалось загрузить исключения");
      setContract(previewPayload.contract ?? null);
      setOverrides(subscriptionPayload.overrides ?? []);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Не удалось собрать предпросмотр");
    } finally {
      setBusy(null);
    }
  }

  async function assignPlan() {
    if (!contract || !selectedPlanId) return;
    const selectedPlan = activePlans.find((plan) => plan.id === selectedPlanId);
    if (!window.confirm(`Назначить организатору тариф «${selectedPlan?.name ?? "выбранный тариф"}»?`)) {
      return;
    }
    const expectedVersion = contract.subscription?.source === "subscription" ? contract.subscription.rowVersion : 0;
    setBusy("assign");
    try {
      const response = await fetch("/api/admin/commercial/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          organizerUserId: organizerUserId.trim(),
          planId: selectedPlanId,
          expectedVersion,
          startsAt: null,
          endsAt: null,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не удалось назначить тариф");
      setMessage("Тариф организатора обновлён.");
      await previewOrganizer();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Не удалось назначить тариф");
    } finally {
      setBusy(null);
    }
  }

  async function saveOverride() {
    const current = overrides.find((item) => item.entitlement_key === overrideKey);
    setBusy("override");
    setError(null);
    try {
      const response = await fetch("/api/admin/commercial/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_override",
          organizerUserId: organizerUserId.trim(),
          entitlementKey: overrideKey,
          enabled: overrideEnabled === "true",
          limitValue: overrideLimit ? Number(overrideLimit) : null,
          reason: overrideReason.trim(),
          endsAt: null,
          expectedVersion: current?.row_version ?? 0,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось сохранить исключение");
      }
      setOverrideReason("");
      setOverrideLimit("");
      setMessage("Индивидуальное исключение сохранено.");
      await previewOrganizer();
    } catch (overrideError) {
      setError(
        overrideError instanceof Error
          ? overrideError.message
          : "Не удалось сохранить исключение"
      );
    } finally {
      setBusy(null);
    }
  }

  async function deleteOverride(override: OverrideRow) {
    setBusy(`delete:${override.id}`);
    setError(null);
    try {
      const response = await fetch("/api/admin/commercial/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_override",
          overrideId: override.id,
          expectedVersion: override.row_version,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось удалить исключение");
      }
      setMessage("Индивидуальное исключение удалено.");
      await previewOrganizer();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить исключение"
      );
    } finally {
      setBusy(null);
    }
  }

  const activePlans = useMemo(
    () => data?.plans.filter((plan) => plan.status === "active") ?? [],
    [data]
  );
  const adapterById = useMemo(
    () => new Map((data?.adapters ?? []).map((adapter) => [adapter.id, adapter])),
    [data]
  );
  const definitionByKey = useMemo(
    () => new Map((data?.definitions ?? []).map((definition) => [definition.key, definition])),
    [data],
  );
  const selectedOverrideDefinition = useMemo(
    () => data?.definitions.find((definition) => definition.key === overrideKey) ?? null,
    [data, overrideKey]
  );

  function draftEditFor(plan: PlanRow): DraftPlanEdit {
    return (
      draftEdits[plan.id] ?? {
        name: plan.name,
        description: plan.description ?? "",
        priceMajor: formatMajorPrice(plan.price_minor),
        currency: plan.currency,
        billingPeriod: plan.billing_period,
      }
    );
  }

  function updateDraftEdit(plan: PlanRow, patch: Partial<DraftPlanEdit>) {
    setDraftEdits((current) => ({
      ...current,
      [plan.id]: { ...draftEditFor(plan), ...patch },
    }));
  }

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="Тарифы и возможности"
          subtitle="Единые права организаторов для туров, апартаментов, авто, трансферов и будущих модулей"
          actions={
            <Button variant="outline" onClick={() => void loadPlans()} disabled={loading}>
              <RefreshCcw className="h-4 w-4" /> Обновить
            </Button>
          }
        />

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <div className="flex items-start gap-3">
            <Boxes className="mt-0.5 h-5 w-5 text-sky" aria-hidden />
            <div>
              <h2 className="font-heading text-lg font-bold text-charcoal">Новая версия тарифа</h2>
              <p className="text-sm text-slate">Сначала создаётся безопасный черновик; действующий тариф не меняется.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={newCode} onChange={(event) => setNewCode(event.target.value)} placeholder="Код, например pro" />
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Название" />
            <NativeSelect value={cloneFromPlanId} onChange={(event) => setCloneFromPlanId(event.target.value)}>
              <option value="">Без копирования прав</option>
              {activePlans.map((plan) => <option key={plan.id} value={plan.id}>Копировать {plan.name} v{plan.version}</option>)}
            </NativeSelect>
            <Button onClick={() => void createPlan()} disabled={busy === "create" || !newCode.trim() || !newName.trim()}>Создать черновик</Button>
          </div>
        </section>

        <section className="space-y-4">
          {(data?.plans ?? []).map((plan) => {
            const planGrants = new Map((data?.grants ?? []).filter((grant) => grant.plan_id === plan.id).map((grant) => [grant.entitlement_key, grant]));
            return (
              <article key={plan.id} className={`${cabinetCardClass} space-y-4 p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading text-lg font-bold text-charcoal">{plan.name} · v{plan.version}</h2>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-slate">{STATUS_LABELS[plan.status]}</span>
                      {plan.is_default ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">По умолчанию</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate">Внутренний код: {plan.code}</p>
                  </div>
                  <div className="flex gap-2">
                    {plan.status === "draft" ? (
                      <>
                        <Button size="sm" onClick={() => confirmPlanChange(plan, { action: "activate", makeDefault: false }, "Версия активирована.", `Активировать тариф «${plan.name}»? После активации эту версию нельзя будет редактировать.`)}>Активировать</Button>
                        <Button size="sm" variant="outline" onClick={() => confirmPlanChange(plan, { action: "activate", makeDefault: true }, "Версия активирована как тариф по умолчанию.", `Сделать тариф «${plan.name}» основным для организаторов без персонального назначения?`)}>Сделать основной</Button>
                      </>
                    ) : null}
                    {!plan.is_default && plan.status !== "retired" ? <Button size="sm" variant="outline" onClick={() => confirmPlanChange(plan, { action: "retire" }, "Версия перемещена в архив.", `Переместить тариф «${plan.name}» в архив?`)}>В архив</Button> : null}
                  </div>
                </div>

                {plan.status === "draft" ? (
                  <div className="grid gap-2 rounded-2xl border border-gray-100 bg-white p-3 md:grid-cols-2 xl:grid-cols-5">
                    <Input
                      value={draftEditFor(plan).name}
                      onChange={(event) => updateDraftEdit(plan, { name: event.target.value })}
                      placeholder="Название"
                    />
                    <Input
                      value={draftEditFor(plan).description}
                      onChange={(event) =>
                        updateDraftEdit(plan, { description: event.target.value })
                      }
                      placeholder="Описание"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draftEditFor(plan).priceMajor}
                      onChange={(event) =>
                        updateDraftEdit(plan, { priceMajor: event.target.value })
                      }
                      placeholder="Цена"
                    />
                    <NativeSelect
                      value={draftEditFor(plan).currency}
                      onChange={(event) =>
                        updateDraftEdit(plan, { currency: event.target.value })
                      }
                    >
                      {CURRENCIES.map((currency) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </NativeSelect>
                    <div className="flex gap-2">
                      <NativeSelect
                        value={draftEditFor(plan).billingPeriod}
                        onChange={(event) =>
                          updateDraftEdit(plan, { billingPeriod: event.target.value })
                        }
                      >
                        <option value="none">Без периода</option>
                        <option value="monthly">Ежемесячно</option>
                        <option value="yearly">Ежегодно</option>
                      </NativeSelect>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const edit = draftEditFor(plan);
                          void patchPlan(
                            plan,
                            {
                              action: "update",
                              name: edit.name,
                              description: edit.description,
                              priceMinor: parseMinorPrice(edit.priceMajor),
                              currency: edit.currency,
                              billingPeriod: edit.billingPeriod,
                            },
                            "Параметры черновика сохранены."
                          );
                        }}
                      >
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {(data?.definitions ?? []).map((definition) => {
                    const grant = planGrants.get(definition.key);
                    const adapter = definition.adapter_id ? adapterById.get(definition.adapter_id) : null;
                    const futureDisabled = adapter?.status === "future_disabled";
                    const draftLimitKey = `${plan.id}:${definition.key}`;
                    const draftLimit =
                      draftLimits[draftLimitKey] ?? String(grant?.limit_value ?? 0);
                    return (
                      <div key={definition.key} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-charcoal">{definition.label}</p>
                            {definition.description ? (
                              <p className="mt-0.5 text-xs text-slate">{definition.description}</p>
                            ) : null}
                          </div>
                          <span className={`text-xs font-semibold ${grant?.enabled && !futureDisabled ? "text-emerald-700" : "text-slate"}`}>{grant?.enabled && !futureDisabled ? "Включено" : "Выключено"}</span>
                        </div>
                        {futureDisabled ? <p className="mt-2 text-xs text-amber-700">Будущий модуль: включение заблокировано.</p> : null}
                        {plan.status === "draft" ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {definition.value_type === "limit" ? (
                              <Input
                                type="number"
                                min={0}
                                max={definition.hard_limit ?? undefined}
                                value={draftLimit}
                                onChange={(event) =>
                                  setDraftLimits((current) => ({
                                    ...current,
                                    [draftLimitKey]: event.target.value,
                                  }))
                                }
                                aria-label={`Лимит: ${definition.label}`}
                                className="h-9 w-24 px-2 text-xs"
                              />
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={futureDisabled || busy?.startsWith(plan.id)}
                              onClick={() =>
                                void patchPlan(
                                  plan,
                                  {
                                    action: "set_entitlement",
                                    entitlementKey: definition.key,
                                    enabled: !(grant?.enabled ?? false),
                                    limitValue:
                                      definition.value_type === "limit"
                                        ? Number(draftLimit)
                                        : null,
                                  },
                                  "Право черновика обновлено."
                                )
                              }
                            >
                              {grant?.enabled ? "Отключить" : "Включить"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        <CapabilityGate
          capability="users.manage"
          fallback={
            <section className={`${cabinetCardClass} p-5 text-sm text-slate`}>
              Управление тарифами организаторов доступно администраторам с правом
              управления пользователями.
            </section>
          }
        >
          <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-sky" aria-hidden />
            <div>
              <h2 className="font-heading text-lg font-bold text-charcoal">Права организатора</h2>
              <p className="text-sm text-slate">Выберите организатора, чтобы проверить его тариф и индивидуальные исключения.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              value={organizerUserId}
              onChange={(event) => {
                setOrganizerUserId(event.target.value);
                setContract(null);
                setOverrides([]);
              }}
              className="min-w-[320px] flex-1"
            >
              <option value="">Выберите организатора</option>
              {organizers.map((organizer) => (
                <option key={organizer.id} value={organizer.id}>
                  {organizer.fullName}{organizer.email ? ` · ${organizer.email}` : ""}
                </option>
              ))}
            </NativeSelect>
            <Button variant="outline" onClick={() => void previewOrganizer()} disabled={!organizerUserId.trim() || busy === "preview"}>Проверить права</Button>
          </div>
          {contract ? (
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-charcoal">{contract.plan ? `${contract.plan.name} v${contract.plan.version}` : "Тариф не определён"}</p>
                  <p className="text-xs text-slate">
                    {contract.ok
                      ? "Итоговые возможности рассчитаны"
                      : DENIAL_REASON_LABELS[contract.denialReason ?? ""] ?? "Права временно недоступны."}
                  </p>
                </div>
                {contract.ok ? <BadgeCheck className="h-5 w-5 text-emerald-600" aria-label="Контракт активен" /> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <NativeSelect value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
                  {activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} v{plan.version}</option>)}
                </NativeSelect>
                <Button onClick={() => void assignPlan()} disabled={!selectedPlanId || busy === "assign"}>Назначить тариф</Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {Object.values(contract.entitlements).map((decision) => (
                  <div key={decision.key} className="rounded-xl bg-white p-3 text-xs">
                    <p className="font-semibold text-charcoal">
                      {definitionByKey.get(decision.key)?.label ?? "Возможность тарифа"}
                    </p>
                    <p className={decision.enabled ? "text-emerald-700" : "text-slate"}>{decision.enabled ? "Разрешено" : "Недоступно"}{decision.limit !== null ? ` · лимит ${decision.limit}` : ""}</p>
                    <p className="mt-1 text-slate">{decision.reason}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-charcoal">Индивидуальное исключение</p>
                {overrides.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {overrides.map((override) => (
                      <div
                        key={override.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-charcoal">
                            {definitionByKey.get(override.entitlement_key)?.label ?? "Индивидуальная возможность"}
                          </p>
                          <p className="text-slate">
                            {override.enabled === null
                              ? "Состояние из тарифа"
                              : override.enabled
                                ? "Разрешено"
                                : "Запрещено"}
                            {override.limit_value !== null
                              ? ` · лимит ${override.limit_value}`
                              : ""}
                            {` · ${override.reason}`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === `delete:${override.id}`}
                          onClick={() => void deleteOverride(override)}
                        >
                          Удалить
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-2 grid gap-2 md:grid-cols-4">
                  <NativeSelect
                    value={overrideKey}
                    onChange={(event) => {
                      const nextKey = event.target.value;
                      setOverrideKey(nextKey);
                      if (
                        data?.definitions.find((definition) => definition.key === nextKey)
                          ?.value_type !== "limit"
                      ) {
                        setOverrideLimit("");
                      }
                    }}
                  >
                    {(data?.definitions ?? []).map((definition) => {
                      const adapter = definition.adapter_id
                        ? adapterById.get(definition.adapter_id)
                        : null;
                      return (
                        <option
                          key={definition.key}
                          value={definition.key}
                          disabled={adapter?.status === "future_disabled"}
                        >
                          {definition.label}
                          {adapter?.status === "future_disabled" ? " — будущий модуль" : ""}
                        </option>
                      );
                    })}
                  </NativeSelect>
                  <NativeSelect value={overrideEnabled} onChange={(event) => setOverrideEnabled(event.target.value)}><option value="true">Разрешить</option><option value="false">Запретить</option></NativeSelect>
                  <Input
                    type="number"
                    min={0}
                    value={overrideLimit}
                    onChange={(event) => setOverrideLimit(event.target.value)}
                    placeholder={
                      selectedOverrideDefinition?.value_type === "limit"
                        ? "Новый лимит"
                        : "Для этого права лимит не нужен"
                    }
                    disabled={selectedOverrideDefinition?.value_type !== "limit"}
                  />
                  <Input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Причина" />
                </div>
                <Button
                  className="mt-2"
                  size="sm"
                  disabled={overrideReason.trim().length < 3 || busy === "override"}
                  onClick={() => void saveOverride()}
                >
                  Сохранить исключение
                </Button>
              </div>
            </div>
          ) : null}
          </section>
        </CapabilityGate>
      </AdminPageShell>
    </CapabilityGate>
  );
}
