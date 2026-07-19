"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type { ContentFreshnessDocType, ContentFreshnessItem } from "@/types/content-freshness";

type ContentFreshnessResponse = {
  staleAfterDays: number;
  criticalAfterDays: number;
  availableDocTypes: ContentFreshnessDocType[];
  selectedDocType: ContentFreshnessDocType | "all";
  items: ContentFreshnessItem[];
  summary: {
    staleCount: number;
    criticalCount: number;
    total: number;
  };
  knowledgeBase: {
    counts: Record<string, number>;
    issues: Array<{ code: string; count: number }>;
    criticalEntries: Array<{
      id: string;
      route: string;
      title?: string;
      issues?: Array<{ code: string }>;
    }>;
  };
};

const KB_ISSUE_LABELS: Record<string, string> = {
  not_publication_ready: "не готово к публикации",
  mixed_script_word: "смешение алфавитов",
  non_russian_title: "заголовок не на русском",
  non_russian_summary: "описание не на русском",
  placeholder_content: "текст-заглушка",
  missing_sensitive_source: "нет источника у чувствительного материала",
  missing_primary_source: "нет первичного источника",
  missing_sensitive_reviewer: "не назначен проверяющий",
  verification_due: "истёк срок проверки",
  missing_media_rights: "не подтверждены права на медиа",
  thin_content: "слишком мало полезного текста",
  missing_hero: "нет обложки",
};

const DOC_TYPE_LABELS: Record<ContentFreshnessDocType, string> = {
  legal: "Юридические документы",
  blog: "Блог",
  knowledge: "База знаний",
  guide: "Путеводители и иммиграция",
  destination: "Направления",
  place: "Места",
  author_article: "Статьи экспертов",
};

function formatRuDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function ContentFreshnessView() {
  const [docType, setDocType] = useState<ContentFreshnessDocType | "all">("all");
  const endpoint = useMemo(() => {
    const query = docType === "all" ? "" : `?docType=${encodeURIComponent(docType)}`;
    return `/api/admin/content-freshness${query}`;
  }, [docType]);

  const { data, loading, error, refresh } = useAdminApi<ContentFreshnessResponse>(endpoint);
  const items = data?.items ?? [];

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="Актуальность контента"
          subtitle="Материалы старше 90 дней попадают в очередь проверки"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Всего устаревших</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{data?.summary.total ?? 0}</p>
          </div>
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">
              К проверке ({data?.staleAfterDays ?? 90}+)
            </p>
            <p className="mt-2 font-heading text-2xl font-bold text-amber-700">
              {data?.summary.staleCount ?? 0}
            </p>
          </div>
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">
              Критично ({data?.criticalAfterDays ?? 180}+)
            </p>
            <p className="mt-2 font-heading text-2xl font-bold text-red-700">
              {data?.summary.criticalCount ?? 0}
            </p>
          </div>
        </section>

        <section className={`${cabinetCardClass} space-y-5 p-5`}>
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Здоровье базы знаний</h2>
            <p className="mt-1 text-sm text-slate">
              Критичные записи автоматически исключаются из публичных страниц, поиска, карты и sitemap.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Всего записей", data?.knowledgeBase.counts.total ?? 0],
              ["В карантине", data?.knowledgeBase.counts.critical ?? 0],
              ["Высокий приоритет", data?.knowledgeBase.counts.high ?? 0],
              ["Не индексируются", data?.knowledgeBase.counts.notIndexable ?? 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-gray-100 bg-surface-muted/60 p-4">
                <p className="text-xs text-slate">{label}</p>
                <p className="mt-1 font-heading text-xl font-bold text-charcoal">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-charcoal">Основные причины карантина</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {(data?.knowledgeBase.issues ?? []).slice(0, 10).map((issue) => (
                  <li key={issue.code} className="flex items-center justify-between gap-4">
                    <span className="text-slate">{KB_ISSUE_LABELS[issue.code] ?? issue.code}</span>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
                      {issue.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal">Первые записи в очереди</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {(data?.knowledgeBase.criticalEntries ?? []).slice(0, 10).map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-gray-100 p-3">
                    <a href={entry.route} target="_blank" rel="noreferrer" className="font-medium text-charcoal hover:text-sky">
                      {entry.title || entry.id}
                    </a>
                    <p className="mt-1 text-xs text-slate">
                      {(entry.issues ?? []).map((issue) => KB_ISSUE_LABELS[issue.code] ?? issue.code).join("; ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <div className="flex flex-wrap items-center gap-3">
            <NativeSelect
              value={docType}
              onChange={(event) => setDocType(event.target.value as ContentFreshnessDocType | "all")}
              className="w-full sm:w-72"
            >
              <option value="all">Все типы</option>
              {(data?.availableDocTypes ?? []).map((type) => (
                <option key={type} value={type}>
                  {DOC_TYPE_LABELS[type] ?? type}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-slate">
              Отображаются только документы с давностью проверки больше {data?.staleAfterDays ?? 90} дней.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <ul className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <li className="px-5 py-8 text-sm text-slate">
                  {loading ? "Загрузка…" : "Просроченных материалов по выбранному типу нет."}
                </li>
              ) : (
                items.map((item) => (
                  <li key={`${item.docType}:${item.docSlug}`} className="space-y-3 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-charcoal hover:text-sky"
                        >
                          {item.title}
                        </a>
                        <p className="text-xs text-slate">
                          {DOC_TYPE_LABELS[item.docType] ?? item.docType} · {item.docSlug}
                        </p>
                      </div>
                      <span
                        className={
                          item.status === "critical"
                            ? "inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
                            : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
                        }
                      >
                        {item.status === "critical" ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                        {item.ageDays} дн. без проверки
                      </span>
                    </div>

                    <dl className="grid gap-2 text-sm text-slate sm:grid-cols-3">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate/80">Последняя проверка</dt>
                        <dd className="mt-0.5 font-medium text-charcoal">{formatRuDate(item.lastVerifiedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate/80">Следующий ревью-срок</dt>
                        <dd className="mt-0.5 font-medium text-charcoal">{formatRuDate(item.nextReviewAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate/80">Ответственный</dt>
                        <dd className="mt-0.5 font-medium text-charcoal">{item.owner}</dd>
                      </div>
                    </dl>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
