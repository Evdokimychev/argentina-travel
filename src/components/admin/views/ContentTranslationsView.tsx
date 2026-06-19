"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";

type LocaleStatus = "missing" | "draft" | "archived" | "published_incomplete" | "published_complete";

type TranslationRow = {
  docType: string;
  docTypeLabel: string;
  slug: string;
  title: string;
  href: string;
  translationStatus: {
    ru_complete: boolean;
    es_status: LocaleStatus;
    en_status: LocaleStatus;
  };
  missingLocales: Array<"es" | "en">;
  editors: {
    ru: string | null;
    es: string | null;
    en: string | null;
  };
};

type TranslationResponse = {
  summary?: {
    total: number;
    esReady: number;
    enReady: number;
    esCoveragePercent: number;
    enCoveragePercent: number;
    missingEs: number;
    missingEn: number;
    ruComplete: number;
  };
  rows?: TranslationRow[];
  generatedAt?: string;
};

const STATUS_LABELS: Record<LocaleStatus, string> = {
  missing: "Нет перевода",
  draft: "Черновик",
  archived: "В архиве",
  published_incomplete: "Опубликовано, но неполно",
  published_complete: "Готово",
};

function localeStatusClass(status: LocaleStatus): string {
  if (status === "published_complete") return "bg-emerald-100 text-emerald-800";
  if (status === "draft") return "bg-amber-100 text-amber-800";
  if (status === "published_incomplete") return "bg-orange-100 text-orange-800";
  if (status === "archived") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-slate";
}

function LocaleStatusCell({
  locale,
  status,
  editHref,
}: {
  locale: "es" | "en";
  status: LocaleStatus;
  editHref: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${localeStatusClass(status)}`}
      >
        {STATUS_LABELS[status]}
      </span>
      {editHref ? (
        <Link href={editHref} className="text-xs font-medium text-sky hover:underline">
          {status === "missing" ? `Создать ${locale.toUpperCase()}` : `Редактировать ${locale.toUpperCase()}`}
        </Link>
      ) : (
        <span className="text-xs text-slate">Нет RU-основы</span>
      )}
    </div>
  );
}

export default function ContentTranslationsView() {
  const { data, loading, error, refresh } = useAdminApi<TranslationResponse>("/api/admin/content/translations");
  const rows = data?.rows ?? [];
  const summary = data?.summary;

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="Переводы контента (ES/EN)"
          subtitle="Контроль готовности переводов и быстрые переходы в редактор CMS"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Всего документов</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{summary?.total ?? 0}</p>
          </div>
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">ES покрытие</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
              {summary?.esCoveragePercent ?? 0}%
            </p>
          </div>
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">EN покрытие</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
              {summary?.enCoveragePercent ?? 0}%
            </p>
          </div>
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Нужно для ES</p>
            <p className="mt-2 font-heading text-2xl font-bold text-amber-700">{summary?.missingEs ?? 0}</p>
          </div>
          <div className={cabinetStatCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Нужно для EN</p>
            <p className="mt-2 font-heading text-2xl font-bold text-amber-700">{summary?.missingEn ?? 0}</p>
          </div>
        </section>

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-charcoal">Документы с неполным покрытием</h2>
            <p className="mt-1 text-xs text-slate">
              В таблице показаны материалы, где испанская или английская версия ещё не готова к публикации.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-slate">
                  <th className="px-5 py-3 font-medium">Документ</th>
                  <th className="px-5 py-3 font-medium">RU</th>
                  <th className="px-5 py-3 font-medium">ES</th>
                  <th className="px-5 py-3 font-medium">EN</th>
                  <th className="px-5 py-3 font-medium">Публичная ссылка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-sm text-slate">
                      {loading ? "Загрузка…" : "Отлично: для ES и EN не осталось незавершённых переводов."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={`${row.docType}:${row.slug}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-charcoal">{row.title}</p>
                        <p className="text-xs text-slate">
                          {row.docTypeLabel} · {row.slug}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.translationStatus.ru_complete
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {row.translationStatus.ru_complete ? "Готово" : "Неполно"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <LocaleStatusCell
                          locale="es"
                          status={row.translationStatus.es_status}
                          editHref={row.editors.es}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <LocaleStatusCell
                          locale="en"
                          status={row.translationStatus.en_status}
                          editHref={row.editors.en}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Link href={row.href} target="_blank" className="text-xs font-medium text-sky hover:underline">
                          Открыть страницу
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
