import Link from "next/link";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type {
  IntegrationReadinessGroup,
  IntegrationReadinessItem,
  IntegrationReadinessStatus,
} from "@/lib/integrations/admin-readiness";

const GROUP_LABELS: Record<IntegrationReadinessGroup, string> = {
  platform: "Платформа",
  payments: "Платежи",
  marketplace: "Туры и партнёры",
  marketing: "Продвижение и сервис",
};

const STATUS_META: Record<IntegrationReadinessStatus, { label: string; className: string }> = {
  ready: { label: "Подключено", className: "bg-emerald-50 text-emerald-700" },
  partial: { label: "Настроено частично", className: "bg-amber-50 text-amber-800" },
  missing: { label: "Нужно подключить", className: "bg-rose-50 text-rose-700" },
  built_in: { label: "Работает", className: "bg-sky/10 text-sky-ink" },
  planned: { label: "Следующий этап", className: "bg-surface-muted text-slate" },
};

export default function IntegrationReadinessPanel({ items }: { items?: IntegrationReadinessItem[] }) {
  const integrations = items ?? [];

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
                    return (
                      <article key={entry.id} className="rounded-2xl border border-border-subtle bg-surface-muted/45 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-foreground">{entry.label}</h4>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate">{entry.summary}</p>
                        {entry.missingVariables?.length ? (
                          <p className="mt-2 break-words text-[11px] leading-5 text-amber-800">
                            Не хватает: {entry.missingVariables.join(", ")}
                          </p>
                        ) : null}
                        {entry.href ? (
                          <Link href={entry.href} className="mt-3 inline-flex text-xs font-semibold text-sky-ink hover:underline">
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
