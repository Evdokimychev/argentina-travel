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
  const status = entry.ok ? "OK" : "ошибка";
  return `${entry.ranAt} — ${status}: ${entry.message}`;
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
          ? ` Meili: ${json.meilisearch.error ?? "ошибка синхронизации"}.`
          : json.meilisearch?.synced
            ? ` Meili: ${json.meilisearch.synced} док.`
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
      if (!res.ok) throw new Error(json.error ?? "Ошибка синхронизации manifest");
      setMessage(
        `Manifest: добавлено ${json.added ?? 0}, обновлено ${json.updated ?? 0}.`
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
          <h2 className="font-heading text-lg font-bold text-charcoal">CMS и поиск</h2>
          <p className="mt-1 text-sm text-slate">
            Эксплуатационные действия: индексация поиска, manifest медиатеки, отложенная публикация.
          </p>
        </div>
      </div>

      {cmsOps?.maintenanceMode ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Режим обслуживания включён</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Публичный сайт перенаправляется на{" "}
              <Link href="/maintenance" className="underline" target="_blank" rel="noopener noreferrer">
                /maintenance
              </Link>
              . Текст и таймер — в блоке «Заглушка при работах» ниже. Админка и API доступны.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate">
          Предпросмотр заглушки:{" "}
          <Link href="/maintenance" className="text-sky underline" target="_blank" rel="noopener noreferrer">
            /maintenance
          </Link>
          . Включите «Режим обслуживания» в разделе «Юридическое и функции», чтобы закрыть публичный сайт.
        </p>
      )}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate">Meilisearch</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {meiliConfigured ? "Настроен (MEILISEARCH_*)" : "Не настроен — Postgres/static"}
          </dd>
        </div>
        <div>
          <dt className="text-slate">Последняя переиндексация</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {lastReindex
              ? `${lastReindex.ranAt} — ${lastReindex.ok ? "OK" : "ошибка"} (${lastReindex.indexed} док.)`
              : "—"}
          </dd>
        </div>
        {readiness?.documentCount != null ? (
          <div>
            <dt className="text-slate">Документов в Meili</dt>
            <dd className="mt-1 font-medium text-charcoal">{readiness.documentCount}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate">Запланировано к публикации</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {cmsOps?.scheduledPublishCount ?? "—"} док.
          </dd>
        </div>
        <div>
          <dt className="text-slate">CMS-медиа без manifest</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {cmsOps?.cmsMediaPendingManifest ?? "—"} файлов
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate">Cron: отложенная публикация CMS</dt>
          <dd className="mt-1 font-medium text-charcoal">
            {formatCronRoute(cronHealth, "/api/cron/cms/publish-scheduled")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate">Cron: переиндексация поиска</dt>
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
          {syncingManifest ? "Синхронизация…" : "Sync manifest медиа"}
        </Button>
      </div>

      {message ? <p className="text-xs text-slate">{message}</p> : null}

      <p className="text-xs text-slate">
        Поиск обновляется автоматически при публикации CMS-документов и ежедневно через platform-maintenance.
        Полная переиндексация нужна после cutover Meilisearch или массового импорта. Проверка:{" "}
        <code className="rounded bg-muted/10 px-1">npm run search:readiness</code>.
      </p>
    </section>
  );
}
