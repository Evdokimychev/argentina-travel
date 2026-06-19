"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, Puzzle, Send, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cabinetCardClass, cabinetHeroClass } from "@/lib/cabinet-ui";
import {
  buildOrganizerApiExample,
  buildOrganizerEmbedSnippet,
} from "@/lib/public-api/organizer-integrations";
import type { PublicApiKeyWithUsage } from "@/types/public-api";
import {
  PARTNER_WEBHOOK_EVENTS,
  type PartnerWebhookEvent,
  type PartnerWebhookRecord,
} from "@/types/partner-webhook";

type ApiKeysResponse = {
  keys?: PublicApiKeyWithUsage[];
  organizerId?: string;
  error?: string;
};

type WebhooksResponse = {
  webhooks?: PartnerWebhookRecord[];
  webhook?: PartnerWebhookRecord;
  error?: string;
  ok?: boolean;
};

const WEBHOOK_EVENT_LABELS: Record<PartnerWebhookEvent, string> = {
  "booking.created": "Заявка создана",
  "booking.confirmed": "Заявка подтверждена",
  "booking.cancelled": "Заявка отменена",
};

function UsageStatsBlock({ usage }: { usage: PublicApiKeyWithUsage["usage"] }) {
  if (usage.requestsLast7d === 0) {
    return <p className="text-xs text-slate">За 7 дней запросов не было.</p>;
  }

  return (
    <div className="space-y-1 text-xs text-slate">
      <p>Запросов за 7 дней: {usage.requestsLast7d}</p>
      {usage.topEndpoints.length > 0 ? (
        <ul className="space-y-0.5">
          {usage.topEndpoints.map((item) => (
            <li key={item.endpoint}>
              {item.endpoint} — {item.count}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          {copied ? "Скопировано" : "Копировать"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-charcoal">
        {value}
      </pre>
    </div>
  );
}

export default function OrganizerIntegrationsView() {
  const { user } = useAuth();
  const supabaseMode = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<PublicApiKeyWithUsage[]>([]);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<PartnerWebhookRecord[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<PartnerWebhookEvent[]>([
    ...PARTNER_WEBHOOK_EVENTS,
  ]);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [togglingWebhookId, setTogglingWebhookId] = useState<string | null>(null);
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    if (!supabaseMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/api-keys");
      const json = (await res.json()) as ApiKeysResponse;
      if (!res.ok) {
        setError(json.error ?? "Не удалось загрузить ключи");
        return;
      }
      setKeys(json.keys ?? []);
      setOrganizerId(json.organizerId ?? user?.id ?? null);
    } catch {
      setError("Не удалось загрузить ключи");
    } finally {
      setLoading(false);
    }
  }, [supabaseMode, user?.id]);

  const loadWebhooks = useCallback(async () => {
    if (!supabaseMode) {
      return;
    }

    try {
      const res = await fetch("/api/organizer/webhooks");
      const json = (await res.json()) as WebhooksResponse;
      if (!res.ok) {
        setError(json.error ?? "Не удалось загрузить вебхуки");
        return;
      }
      setWebhooks(json.webhooks ?? []);
    } catch {
      setError("Не удалось загрузить вебхуки");
    }
  }, [supabaseMode]);

  useEffect(() => {
    void Promise.all([loadKeys(), loadWebhooks()]);
  }, [loadKeys, loadWebhooks]);

  const activeKeys = useMemo(
    () => keys.filter((key) => key.isActive && !key.revokedAt),
    [keys]
  );
  const revokedKeys = useMemo(
    () => keys.filter((key) => !key.isActive || key.revokedAt),
    [keys]
  );

  const embedSnippet = organizerId ? buildOrganizerEmbedSnippet(organizerId) : "";
  const apiExample = organizerId ? buildOrganizerApiExample(organizerId) : "";

  async function createKey() {
    setCreating(true);
    setCreatedRawKey(null);
    try {
      const res = await fetch("/api/organizer/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const json = (await res.json()) as { error?: string; rawKey?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка создания");
      setCreatedRawKey(json.rawKey ?? null);
      setLabel("");
      await loadKeys();
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!window.confirm("Отозвать API-ключ? Интеграция перестанет работать.")) return;
    setRevokingId(id);
    try {
      const res = await fetch(`/api/organizer/api-keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка отзыва");
      await loadKeys();
    } catch (revokeError) {
      alert(revokeError instanceof Error ? revokeError.message : "Ошибка");
    } finally {
      setRevokingId(null);
    }
  }

  function toggleWebhookEvent(event: PartnerWebhookEvent) {
    setWebhookEvents((current) => {
      if (current.includes(event)) {
        const next = current.filter((item) => item !== event);
        return next.length > 0 ? next : [event];
      }
      return [...current, event];
    });
  }

  async function createWebhook() {
    setCreatingWebhook(true);
    setWebhookMessage(null);
    try {
      const res = await fetch("/api/organizer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl.trim(),
          secret: webhookSecret.trim(),
          events: webhookEvents,
          active: true,
        }),
      });
      const json = (await res.json()) as WebhooksResponse;
      if (!res.ok) throw new Error(json.error ?? "Не удалось добавить вебхук");
      setWebhookUrl("");
      setWebhookSecret("");
      setWebhookEvents([...PARTNER_WEBHOOK_EVENTS]);
      setWebhookMessage("Вебхук сохранён. Можно выполнить тестовый ping.");
      await loadWebhooks();
    } catch (createError) {
      alert(createError instanceof Error ? createError.message : "Ошибка");
    } finally {
      setCreatingWebhook(false);
    }
  }

  async function testWebhook(webhookId: string) {
    setTestingWebhookId(webhookId);
    setWebhookMessage(null);
    try {
      const res = await fetch(`/api/organizer/webhooks/${encodeURIComponent(webhookId)}/test`, {
        method: "POST",
      });
      const json = (await res.json()) as { error?: string; delivery?: { attempts: number } };
      if (!res.ok) {
        throw new Error(json.error ?? "Тестовая отправка не удалась");
      }
      const attempts = json.delivery?.attempts ?? 1;
      setWebhookMessage(`Тестовый ping отправлен успешно (попыток: ${attempts}).`);
      await loadWebhooks();
    } catch (testError) {
      alert(testError instanceof Error ? testError.message : "Ошибка");
    } finally {
      setTestingWebhookId(null);
    }
  }

  async function toggleWebhookActive(webhook: PartnerWebhookRecord) {
    setTogglingWebhookId(webhook.id);
    setWebhookMessage(null);
    try {
      const res = await fetch(`/api/organizer/webhooks/${encodeURIComponent(webhook.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !webhook.active }),
      });
      const json = (await res.json()) as WebhooksResponse;
      if (!res.ok) throw new Error(json.error ?? "Не удалось обновить вебхук");
      await loadWebhooks();
    } catch (toggleError) {
      alert(toggleError instanceof Error ? toggleError.message : "Ошибка");
    } finally {
      setTogglingWebhookId(null);
    }
  }

  async function deleteWebhook(webhookId: string) {
    if (!window.confirm("Удалить вебхук? История доставок останется в журнале.")) return;
    setDeletingWebhookId(webhookId);
    setWebhookMessage(null);
    try {
      const res = await fetch(`/api/organizer/webhooks/${encodeURIComponent(webhookId)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось удалить вебхук");
      await loadWebhooks();
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Ошибка");
    } finally {
      setDeletingWebhookId(null);
    }
  }

  if (!supabaseMode) {
    return (
      <div className="space-y-4">
        <header className={cabinetHeroClass}>
          <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">Интеграции</h1>
          <p className="mt-2 text-sm text-slate">
            API-ключи и виджеты доступны после подключения базы данных.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className={cabinetHeroClass}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Puzzle className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">Интеграции</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate">
              Подключайте каталог туров к своему сайту через API или встраиваемый виджет. Ключи
              ограничены вашими турами.
            </p>
          </div>
        </div>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {webhookMessage ? <p className="text-sm text-emerald-700">{webhookMessage}</p> : null}
      {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}

      <section className={`${cabinetCardClass} space-y-4 p-5`}>
        <h2 className="font-heading text-lg font-bold text-charcoal">Виджет на сайте</h2>
        <p className="text-sm text-slate">
          Вставьте код на страницу — отобразится каталог ваших туров.
        </p>
        {embedSnippet ? <CopyBlock label="Код встраивания" value={embedSnippet} /> : null}
      </section>

      <section className={`${cabinetCardClass} space-y-4 p-5`}>
        <h2 className="font-heading text-lg font-bold text-charcoal">Публичное API</h2>
        <p className="text-sm text-slate">
          Базовый адрес: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/api/v1</code>.
          Доступны эндпоинты туров и экскурсий (только чтение).
        </p>
        {apiExample ? <CopyBlock label="Пример запроса" value={apiExample} /> : null}
      </section>

      <section className={`${cabinetCardClass} space-y-4 p-5`}>
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-sky" strokeWidth={1.75} />
          <h2 className="font-heading text-lg font-bold text-charcoal">API-ключи</h2>
        </div>
        <p className="text-sm text-slate">
          Ключ показывается один раз после создания. Храните его как пароль.
        </p>
        <label className="block max-w-md text-sm">
          <span className="text-slate">Название</span>
          <Input
            className="mt-1"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Сайт компании, мобильное приложение…"
          />
        </label>
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
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-sky" strokeWidth={1.75} />
          <h2 className="font-heading text-lg font-bold text-charcoal">Партнёрские вебхуки</h2>
        </div>
        <p className="text-sm text-slate">
          Подключите URL, чтобы получать события заявок. Подпись передаётся в заголовке{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">X-PVA-Signature</code>.
        </p>
        <label className="block text-sm">
          <span className="text-slate">URL вебхука</span>
          <Input
            className="mt-1"
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.target.value)}
            placeholder="https://partner.example.com/webhooks/bookings"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate">Секрет подписи</span>
          <Input
            className="mt-1"
            value={webhookSecret}
            onChange={(event) => setWebhookSecret(event.target.value)}
            placeholder="Ваш общий секрет для HMAC"
          />
        </label>
        <div className="space-y-2">
          <p className="text-sm text-slate">События</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PARTNER_WEBHOOK_EVENTS.map((eventName) => {
              const checked = webhookEvents.includes(eventName);
              return (
                <label
                  key={eventName}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-charcoal"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-sky"
                    checked={checked}
                    onChange={() => toggleWebhookEvent(eventName)}
                  />
                  <span>{WEBHOOK_EVENT_LABELS[eventName]}</span>
                </label>
              );
            })}
          </div>
        </div>
        <Button
          onClick={() => void createWebhook()}
          disabled={creatingWebhook || !webhookUrl.trim() || !webhookSecret.trim()}
        >
          Добавить вебхук
        </Button>
      </section>

      <section className={`${cabinetCardClass} space-y-4 p-5`}>
        <h2 className="font-heading text-lg font-bold text-charcoal">Подключённые вебхуки</h2>
        {webhooks.length === 0 ? (
          <p className="text-sm text-slate">Пока нет подключённых вебхуков.</p>
        ) : (
          <ul className="space-y-3">
            {webhooks.map((webhook) => (
              <li
                key={webhook.id}
                className="space-y-3 rounded-xl border border-gray-100 p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-charcoal break-all">{webhook.url}</p>
                  <p className="text-xs text-slate">
                    Секрет: {webhook.secretMasked || "скрыт"} ·{" "}
                    {webhook.active ? "Активен" : "Отключён"}
                  </p>
                  <p className="text-xs text-slate">
                    События:{" "}
                    {webhook.events.map((event) => WEBHOOK_EVENT_LABELS[event]).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void testWebhook(webhook.id)}
                    disabled={testingWebhookId === webhook.id}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Тестовый ping
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void toggleWebhookActive(webhook)}
                    disabled={togglingWebhookId === webhook.id}
                  >
                    {webhook.active ? "Отключить" : "Включить"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void deleteWebhook(webhook.id)}
                    disabled={deletingWebhookId === webhook.id}
                  >
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
                className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-medium text-charcoal">{key.label}</p>
                  <p className="text-xs text-slate">
                    {key.keyPrefix}… · {key.scopes.join(", ")} · {key.rateLimitPerMinute}/мин
                  </p>
                  {key.lastUsedAt ? (
                    <p className="text-xs text-slate">Последний запрос: {key.lastUsedAt}</p>
                  ) : null}
                  <UsageStatsBlock usage={key.usage} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
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
    </div>
  );
}
