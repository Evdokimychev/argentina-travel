"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminApi } from "@/hooks/useAdminApi";
import { SEO_QUERY_CLUSTERS } from "@/data/seo-query-clusters";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type {
  SearchProviderConnection,
  SearchVisibilityProvider,
  SearchVisibilitySnapshot,
} from "@/lib/seo/search-visibility-types";

type ResponsePayload = { visibility?: SearchVisibilitySnapshot };

const PROVIDER_LABELS: Record<SearchVisibilityProvider, string> = {
  google_search_console: "Google Search Console",
  yandex_webmaster: "Яндекс.Вебмастер",
};

const OPPORTUNITY_LABELS = {
  near_top: "Близко к первой странице",
  low_ctr: "Мало переходов из выдачи",
  protect_winner: "Сохранить сильную позицию",
} as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function formatPosition(value: number | null): string {
  return value === null || value <= 0 ? "Нет данных" : value.toFixed(1);
}

function ProviderConnectionCard({
  provider,
  connection,
  busy,
  onAction,
}: {
  provider: SearchVisibilityProvider;
  connection: SearchProviderConnection | undefined;
  busy: boolean;
  onAction: (input: {
    action: "save" | "sync" | "delete";
    provider: SearchVisibilityProvider;
    propertyUrl?: string;
    credential?: string;
  }) => Promise<void>;
}) {
  const isGoogle = provider === "google_search_console";
  const [propertyUrl, setPropertyUrl] = useState(
    connection?.propertyUrl ?? (isGoogle ? "sc-domain:goargentina.ru" : "https://www.goargentina.ru/"),
  );
  const [credential, setCredential] = useState("");

  return (
    <article className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">{PROVIDER_LABELS[provider]}</h2>
          <p className="mt-1 text-sm text-slate">
            {connection
              ? `${connection.status === "verified" ? "Подключено" : connection.status === "error" ? "Нужно проверить доступ" : "Сохранено, ожидает проверки"} · ${connection.credentialLabel ?? "защищённые данные"}`
              : "Не подключено"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            connection?.status === "verified"
              ? "bg-emerald-50 text-emerald-700"
              : connection?.status === "error"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-800"
          }`}
        >
          {connection?.status === "verified" ? "Данные поступают" : connection ? "Требует внимания" : "Не настроено"}
        </span>
      </div>

      {connection?.lastSyncedAt ? (
        <p className="text-xs text-slate">
          Последнее обновление: {new Date(connection.lastSyncedAt).toLocaleString("ru-RU")}
        </p>
      ) : null}

      <CapabilityGate capability="system.settings" fallback={
        <p className="text-sm text-slate">Подключение может менять только владелец настроек сайта.</p>
      }>
        <div className="space-y-3 rounded-2xl border border-border-subtle bg-surface-muted/40 p-4">
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Ресурс сайта
            <Input value={propertyUrl} onChange={(event) => setPropertyUrl(event.target.value)} />
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            {isGoogle ? "JSON-ключ сервисного аккаунта" : "OAuth-токен Яндекса"}
            {isGoogle ? (
              <Textarea
                rows={5}
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
                placeholder={connection ? "Вставьте новый ключ только для замены" : "Вставьте содержимое JSON-файла"}
              />
            ) : (
              <Input
                type="password"
                autoComplete="new-password"
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
                placeholder={connection ? "Вставьте новый токен только для замены" : "Вставьте токен"}
              />
            )}
          </label>
          <p className="text-xs leading-5 text-slate">
            {isGoogle
              ? "Добавьте email сервисного аккаунта как пользователя ресурса в Search Console, затем сохраните его JSON-ключ здесь."
              : "Токен создаётся в Яндекс OAuth с доступом к Вебмастеру. Яндекс выдаёт его на ограниченный срок, поэтому панель покажет, когда доступ потребуется обновить."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !credential.trim() || !propertyUrl.trim()}
              onClick={() => onAction({ action: "save", provider, propertyUrl, credential })}
            >
              {connection ? "Заменить доступ" : "Сохранить подключение"}
            </Button>
            {connection ? (
              <>
                <Button variant="outline" disabled={busy} onClick={() => onAction({ action: "sync", provider })}>
                  Получить свежие запросы
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Удалить подключение ${PROVIDER_LABELS[provider]} и его метрики?`)) {
                      void onAction({ action: "delete", provider });
                    }
                  }}
                >
                  Отключить
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </CapabilityGate>
    </article>
  );
}

export default function SearchVisibilityView() {
  const [days, setDays] = useState(28);
  const [busyProvider, setBusyProvider] = useState<SearchVisibilityProvider | null>(null);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const { data, loading, error, refresh } = useAdminApi<ResponsePayload>(
    `/api/admin/seo/search-visibility?days=${days}`,
  );
  const visibility = data?.visibility;
  const connections = useMemo(
    () => new Map((visibility?.connections ?? []).map((connection) => [connection.provider, connection])),
    [visibility?.connections],
  );

  async function runAction(input: {
    action: "save" | "sync" | "delete";
    provider: SearchVisibilityProvider;
    propertyUrl?: string;
    credential?: string;
  }) {
    setBusyProvider(input.provider);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/seo/search-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Действие не выполнено");
      setFeedback({ variant: "success", message: result.message ?? "Готово" });
      await refresh();
    } catch (actionError) {
      setFeedback({
        variant: "error",
        message: actionError instanceof Error ? actionError.message : "Действие не выполнено",
      });
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <CapabilityGate capability="analytics.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Поиск и SEO"
          subtitle="Реальные запросы, позиции и понятные точки роста из Google и Яндекса"
          actions={
            <select
              aria-label="Период"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm"
            >
              <option value={28}>28 дней</option>
              <option value={90}>90 дней</option>
              <option value={180}>180 дней</option>
            </select>
          }
        />

        {error ? <InlineFeedback variant="error" title="Данные пока недоступны" description={error} /> : null}
        {feedback ? (
          <InlineFeedback
            variant={feedback.variant}
            title={feedback.variant === "success" ? "Готово" : "Нужно проверить"}
            description={feedback.message}
          />
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          {(["yandex_webmaster", "google_search_console"] as const).map((provider) => (
            <ProviderConnectionCard
              key={provider}
              provider={provider}
              connection={connections.get(provider)}
              busy={busyProvider === provider}
              onAction={runAction}
            />
          ))}
        </section>

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Карта спроса по Аргентине</h2>
            <p className="mt-1 text-sm leading-6 text-slate">
              Стартовые кластеры собраны по намерениям поиска без выдуманных объёмов. После синхронизации
              их приоритет подтверждается фактическими показами из ваших кабинетов.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SEO_QUERY_CLUSTERS.map((cluster) => (
              <article key={cluster.id} className="rounded-2xl border border-border-subtle bg-surface-muted/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-foreground">{cluster.label}</h3>
                  <span className="rounded-full bg-sky/10 px-2 py-1 text-[11px] font-semibold text-sky-ink">
                    P{cluster.priority}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate">{cluster.promise}</p>
                <p className="mt-3 break-all text-xs font-medium text-foreground">Цель: {cluster.targetPath}</p>
                <details className="mt-3 text-xs text-slate">
                  <summary className="cursor-pointer font-medium text-sky-ink">Показать запросы ({cluster.queries.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {cluster.queries.map((query) => <li key={query}>• {query}</li>)}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Показы", value: visibility ? formatNumber(visibility.totals.impressions) : "…" },
            { label: "Переходы", value: visibility ? formatNumber(visibility.totals.clicks) : "…" },
            { label: "CTR", value: visibility ? formatPercent(visibility.totals.ctr) : "…" },
            { label: "Средняя позиция", value: visibility ? formatPosition(visibility.totals.position) : "…" },
          ].map((item) => (
            <div key={item.label} className={cabinetStatCardClass}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate">{item.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-foreground">{loading ? "…" : item.value}</p>
            </div>
          ))}
        </section>

        {visibility?.dataStatus === "not_connected" ? (
          <InlineFeedback
            variant="info"
            title="Подключите хотя бы одну поисковую систему"
            description="После первой синхронизации здесь появятся не предположения, а фактические запросы посетителей и позиции сайта."
          />
        ) : visibility?.dataStatus === "awaiting_sync" ? (
          <InlineFeedback
            variant="info"
            title="Подключение сохранено"
            description="Нажмите «Получить свежие запросы». Далее данные будут обновляться автоматически каждый день."
          />
        ) : null}

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Точки роста</h2>
            <p className="mt-1 text-sm text-slate">
              Сначала запросы с показами и позициями 4–20: они обычно дают самый быстрый полезный результат.
            </p>
          </div>
          {visibility?.opportunities.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border-subtle text-xs uppercase tracking-wide text-slate">
                  <tr><th className="px-2 py-3">Запрос</th><th className="px-2">Тип</th><th className="px-2">Показы</th><th className="px-2">Позиция</th><th className="px-2">Что сделать</th></tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {visibility.opportunities.map((row) => (
                    <tr key={`${row.kind}:${row.query}`}>
                      <td className="px-2 py-3 font-medium text-foreground">{row.query}</td>
                      <td className="px-2 py-3 text-slate">{OPPORTUNITY_LABELS[row.kind]}</td>
                      <td className="px-2 py-3">{formatNumber(row.impressions)}</td>
                      <td className="px-2 py-3">{formatPosition(row.position)}</td>
                      <td className="max-w-md px-2 py-3 text-slate">{row.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate">Точки роста появятся после первой синхронизации.</p>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={`${cabinetCardClass} p-5`}>
            <h2 className="font-heading text-lg font-bold text-foreground">Популярные запросы</h2>
            <ol className="mt-4 space-y-3">
              {(visibility?.topQueries ?? []).slice(0, 15).map((row) => (
                <li key={row.query} className="flex items-start justify-between gap-4 text-sm">
                  <span className="font-medium text-foreground">{row.query}</span>
                  <span className="shrink-0 text-slate">{formatNumber(row.impressions)} показов · № {formatPosition(row.position)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={`${cabinetCardClass} p-5`}>
            <h2 className="font-heading text-lg font-bold text-foreground">Страницы из поиска</h2>
            <ol className="mt-4 space-y-3">
              {(visibility?.topPages ?? []).slice(0, 15).map((row) => (
                <li key={row.page} className="text-sm">
                  <p className="break-all font-medium text-foreground">{row.page}</p>
                  <p className="mt-1 text-xs text-slate">{formatNumber(row.impressions)} показов · {formatNumber(row.clicks)} переходов</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
