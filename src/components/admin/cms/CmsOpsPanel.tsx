"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsOpsSummary } from "@/lib/cms/cms-ops";
import type { SearchOpsSnapshot } from "@/lib/search/search-ops-types";
import type { CronHealthReport } from "@/lib/ops/ops-status";

type Props = {
  cmsOps?: CmsOpsSummary;
  cronHealth?: CronHealthReport;
  searchOps?: SearchOpsSnapshot;
  onRefresh?: () => void;
};

function formatCronRoute(report: CronHealthReport | undefined, route: string): string {
  const entry = report?.latestByRoute[route];
  if (!entry) return "Ещё не запускался";
  const status = entry.ok ? "выполнено успешно" : "завершилось с ошибкой";
  return `${entry.ranAt} — ${status}`;
}

export default function CmsOpsPanel({ cmsOps, cronHealth, searchOps, onRefresh }: Props) {
  const [reindexing, setReindexing] = useState(false);
  const [syncingManifest, setSyncingManifest] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runSearchReindex() {
    setReindexing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/search/reindex", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        indexed?: number;
        meilisearch?: { ok?: boolean; synced?: number; error?: string };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Ошибка переиндексации");
      const meiliNote =
        json.meilisearch?.ok === false
          ? " Дополнительный поисковый индекс пока не обновлён."
          : json.meilisearch?.synced
            ? ` Дополнительный индекс: ${json.meilisearch.synced} документов.`
            : "";
      setMessage(`Поиск обновлён: ${json.indexed ?? 0} документов.${meiliNote}`);
      onRefresh?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setReindexing(false);
    }
  }

  async function runManifestSync() {
    setSyncingManifest(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/media", { method: "PUT" });
      const json = (await res.json()) as {
        added?: number;
        updated?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Не удалось обновить медиатеку");
      setMessage(
        `Медиатека обновлена: добавлено ${json.added ?? 0}, обновлено ${json.updated ?? 0}.`
      );
      onRefresh?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setSyncingManifest(false);
    }
  }

  const meiliConfigured = searchOps?.meilisearchConfigured ?? false;
  const lastReindex = searchOps?.lastReindex;
  const readiness = searchOps?.readiness;

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex items-start gap-3">
        <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
        <div>
          <h2 className="font-heading text-lg font-bold text-charcoal">Публикации и поиск</h2>
          <p className="mt-1 text-sm text-slate">
            Обновление поиска, медиатеки и материалов, запланированных на будущее время.
          </p>
        </div>
      </div>

      {cmsOps?.maintenanceMode ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Режим обслуживания включён</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Посетители видят{" "}
              <Link href="/maintenance" className="underline" target="_blank" rel="noopener noreferrer">
                страницу временного закрытия
              </Link>
              . Текст и таймер — в блоке «Страница временного закрытия» ниже. Панель управления
              остаётся доступной.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate">
          Предпросмотр страницы временного закрытия:{" "}
          <Link href="/maintenance" className="text-sky underline" target="_blank" rel="noopener noreferrer">
            открыть
          </Link>
          . Включите «Режим обслуживания» в разделе «Юридическое и функции», чтобы закрыть публичный сайт.
        </p>
      )}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate">Дополнительный поисковый индекс</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {meiliConfigured ? "Подключён" : "Не подключён — используется встроенный поиск"}
          </dd>
        </div>
        <div>
          <dt className="text-slate">Последняя переиндексация</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {lastReindex
              ? `${lastReindex.ranAt} — ${lastReindex.ok ? "выполнено успешно" : "ошибка"} (${lastReindex.indexed} материалов)`
              : "—"}
          </dd>
        </div>
        {readiness?.documentCount != null ? (
          <div>
            <dt className="text-slate">Документов в дополнительном индексе</dt>
            <dd className="mt-1 font-medium text-charcoal">{readiness.documentCount}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate">Запланировано к публикации</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {cmsOps?.scheduledPublishCount ?? "—"} материалов
          </dd>
        </div>
        <div>
          <dt className="text-slate">Новые файлы, ожидающие обновления медиатеки</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {cmsOps?.cmsMediaPendingManifest ?? "—"} файлов
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate">Автопубликация по расписанию</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {formatCronRoute(cronHealth, "/api/cron/cms/publish-scheduled")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate">Автоматическое обновление поиска</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {formatCronRoute(cronHealth, "/api/cron/search/reindex")}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={reindexing}
          onClick={() => void runSearchReindex()}
        >
          <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {reindexing ? "Переиндексация…" : "Переиндексировать поиск"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={syncingManifest}
          onClick={() => void runManifestSync()}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {syncingManifest ? "Обновление…" : "Обновить медиатеку"}
        </Button>
      </div>

      {message ? <p className="text-xs text-slate">{message}</p> : null}

      <p className="text-xs text-slate">
        Обычно поиск обновляется автоматически. Ручное обновление нужно после массового импорта
        или если опубликованный материал не находится на сайте.
      </p>
    </section>
  );
}
