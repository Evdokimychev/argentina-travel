"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { PublicApiScope } from "@/types/public-api";

type ApiKeyRow = {
  id: string;
  keyPrefix: string;
  label: string;
  partnerName: string | null;
  organizerId: string | null;
  scopes: PublicApiScope[];
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

type ApiKeysResponse = {
  keys?: ApiKeyRow[];
};

const SCOPE_OPTIONS: { value: PublicApiScope; label: string }[] = [
  { value: "tours:read", label: "Туры (чтение)" },
  { value: "excursions:read", label: "Экскурсии (чтение)" },
  { value: "*", label: "Все ресурсы" },
];

export default function AdminApiKeysView() {
  const { data, loading, error, refresh } = useAdminApi<ApiKeysResponse>("/api/admin/api-keys");
  const [label, setLabel] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [organizerId, setOrganizerId] = useState("");
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState("60");
  const [scopes, setScopes] = useState<PublicApiScope[]>(["tours:read", "excursions:read"]);
  const [creating, setCreating] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const activeKeys = useMemo(
    () => (data?.keys ?? []).filter((key) => key.isActive && !key.revokedAt),
    [data?.keys]
  );
  const revokedKeys = useMemo(
    () => (data?.keys ?? []).filter((key) => !key.isActive || key.revokedAt),
    [data?.keys]
  );

  function toggleScope(scope: PublicApiScope) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((item) => item !== scope) : [...prev, scope]
    );
  }

  async function createKey() {
    setCreating(true);
    setCreatedRawKey(null);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          partnerName: partnerName.trim() || undefined,
          organizerId: organizerId.trim() || null,
          rateLimitPerMinute: Number.parseInt(rateLimitPerMinute, 10) || 60,
          scopes,
        }),
      });
      const json = (await res.json()) as { error?: string; rawKey?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка создания");
      setCreatedRawKey(json.rawKey ?? null);
      setLabel("");
      setPartnerName("");
      setOrganizerId("");
      await refresh();
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!window.confirm("Отозвать API-ключ? Партнёр потеряет доступ.")) return;
    setRevokingId(id);
    try {
      const res = await fetch(`/api/admin/api-keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка отзыва");
      await refresh();
    } catch (revokeError) {
      alert(revokeError instanceof Error ? revokeError.message : "Ошибка");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="API-ключи партнёров"
          subtitle="Публичное API v1 для туров и экскурсий"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Новый ключ</h2>
          <p className="text-sm text-slate">
            Ключ показывается один раз после создания. Храните его как пароль.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate">Название</span>
              <Input className="mt-1" value={label} onChange={(e) => setLabel(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-slate">Партнёр</span>
              <Input
                className="mt-1"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Название сайта или агрегатора"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate">Organizer ID (опционально)</span>
              <Input
                className="mt-1"
                value={organizerId}
                onChange={(e) => setOrganizerId(e.target.value)}
                placeholder="Ограничить туры одним организатором"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate">Лимит запросов / мин</span>
              <Input
                className="mt-1"
                type="number"
                min={1}
                max={600}
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(e.target.value)}
              />
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm text-slate">Области доступа</legend>
            <div className="flex flex-wrap gap-4">
              {SCOPE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={scopes.includes(option.value)}
                    onChange={() => toggleScope(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Button onClick={() => void createKey()} disabled={creating || !label.trim()}>
            Сгенерировать ключ
          </Button>
          {createdRawKey ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">Сохраните ключ — он больше не отобразится:</p>
              <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-xs">{createdRawKey}</code>
            </div>
          ) : null}
        </section>

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Активные ключи</h2>
          {activeKeys.length === 0 ? (
            <p className="text-sm text-slate">Нет активных ключей.</p>
          ) : (
            <ul className="space-y-3">
              {activeKeys.map((key) => (
                <li
                  key={key.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-charcoal">{key.label}</p>
                    <p className="mt-1 text-xs text-slate">
                      {key.keyPrefix}… · {key.partnerName ?? "без партнёра"} ·{" "}
                      {key.scopes.join(", ")} · {key.rateLimitPerMinute}/мин
                    </p>
                    {key.lastUsedAt ? (
                      <p className="mt-1 text-xs text-slate">Последний запрос: {key.lastUsedAt}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revokingId === key.id}
                    onClick={() => void revokeKey(key.id)}
                  >
                    Отозвать
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {revokedKeys.length > 0 ? (
          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            <h2 className="font-heading text-lg font-bold text-charcoal">Отозванные</h2>
            <ul className="space-y-2 text-sm text-slate">
              {revokedKeys.map((key) => (
                <li key={key.id}>
                  {key.label} ({key.keyPrefix}…) — отозван {key.revokedAt ?? key.updatedAt}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
