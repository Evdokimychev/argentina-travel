"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type {
  IntegrationReadinessGroup,
  IntegrationReadinessItem,
  IntegrationReadinessStatus,
} from "@/lib/integrations/admin-readiness";
import type { IntegrationVerificationResult } from "@/lib/integrations/verification-server";

const GROUP_LABELS: Record<IntegrationReadinessGroup, string> = {
  platform: "Платформа",
  payments: "Платежи",
  marketplace: "Туры и партнёры",
  marketing: "Продвижение и сервис",
};

const STATUS_META: Record<IntegrationReadinessStatus, { label: string; className: string }> = {
  ready: { label: "Подключено", className: "bg-emerald-50 text-emerald-700" },
  configured: { label: "Настроено, не проверено", className: "bg-amber-50 text-amber-800" },
  partial: { label: "Настроено частично", className: "bg-amber-50 text-amber-800" },
  missing: { label: "Нужно подключить", className: "bg-rose-50 text-rose-700" },
  built_in: { label: "Работает", className: "bg-sky/10 text-sky-ink" },
  planned: { label: "Следующий этап", className: "bg-surface-muted text-slate" },
};

export default function IntegrationReadinessPanel({ items }: { items?: IntegrationReadinessItem[] }) {
  const integrations = items ?? [];
  const [checks, setChecks] = useState<Record<string, IntegrationVerificationResult>>({});
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/integrations/verify", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { checks?: Record<string, IntegrationVerificationResult> };
        if (response.ok && payload.checks) setChecks(payload.checks);
      })
      .catch((cause) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setCheckError("Не удалось загрузить историю проверок. Текущие настройки не считаются проверенными.");
        }
      });
    return () => controller.abort();
  }, []);

  async function verify(id: string) {
    setCheckingId(id);
    setCheckError(null);
    try {
      const response = await fetch("/api/admin/integrations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = (await response.json().catch(() => null)) as {
        result?: IntegrationVerificationResult;
        error?: string;
      } | null;
      if (!response.ok || !body?.result) throw new Error(body?.error ?? "Проверка не выполнена");
      setChecks((current) => ({ ...current, [id]: body.result! }));
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : "Проверка не выполнена");
    } finally {
      setCheckingId(null);
    }
  }

  return (
    <section className={`${cabinetCardClass} space-y-5 p-5`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-ink">Безопасный обзор</p>
        <h2 className="mt-1 font-heading text-lg font-bold text-foreground">Интеграции и внешние сервисы</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate">
          Здесь виден только статус. Пароли и токены не читаются браузером, не входят в резервную копию
          настроек и меняются в защищённом окружении проекта.
        </p>
      </div>

      {checkError ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {checkError}
        </p>
      ) : null}

      {integrations.length === 0 ? (
        <p className="rounded-2xl border border-border-subtle bg-surface-muted/50 p-4 text-sm text-slate">
          Статус интеграций пока недоступен. Обновите страницу после проверки окружения.
        </p>
      ) : (
        <div className="space-y-5">
          {(Object.keys(GROUP_LABELS) as IntegrationReadinessGroup[]).map((group) => {
            const groupItems = integrations.filter((entry) => entry.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group}>
                <h3 className="text-sm font-semibold text-foreground">{GROUP_LABELS[group]}</h3>
                <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupItems.map((entry) => {
                    const status = STATUS_META[entry.status];
                    const check = checks[entry.id];
                    return (
                      <article key={entry.id} className="rounded-2xl border border-border-subtle bg-surface-muted/45 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-foreground">{entry.label}</h4>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate">{entry.summary}</p>
                        {entry.status === "configured" ? (
                          <p className="mt-2 text-[11px] leading-5 text-amber-800">
                            Ключи найдены, но рабочее соединение и свежесть данных ещё не подтверждены.
                          </p>
                        ) : null}
                        {entry.missingVariables?.length ? (
                          <p className="mt-2 break-words text-[11px] leading-5 text-amber-800">
                            Не завершено защищённых настроек: {entry.missingVariables.length}. Значения добавляются владельцем проекта и здесь не показываются.
                          </p>
                        ) : null}
                        {check ? (
                          <p
                            className={`mt-2 text-[11px] leading-5 ${
                              check.status === "verified"
                                ? "text-emerald-700"
                                : check.status === "failed"
                                  ? "text-rose-700"
                                  : "text-amber-800"
                            }`}
                          >
                            {check.summary} Проверено {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(check.checkedAt))}.
                          </p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void verify(entry.id)}
                          disabled={checkingId === entry.id}
                          className="mt-3 inline-flex min-h-9 items-center rounded-xl border border-border-subtle px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-sky/40 hover:text-sky-ink disabled:cursor-wait disabled:opacity-60"
                        >
                          {checkingId === entry.id ? "Проверяем…" : "Проверить безопасно"}
                        </button>
                        {entry.href ? (
                          <Link href={entry.href} className="ml-3 mt-3 inline-flex text-xs font-semibold text-sky-ink hover:underline">
                            Открыть рабочий раздел →
                          </Link>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
