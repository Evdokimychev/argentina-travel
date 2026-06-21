"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { CMS_IMPORT_TYPE_LABELS } from "@/lib/cms/cms-import-preview";
import type { CmsImportPreview } from "@/lib/cms/cms-import-preview";
import type { CmsDocType } from "@/types/cms-content";

const ALL_TYPES = Object.keys(CMS_IMPORT_TYPE_LABELS) as CmsDocType[];

type ImportResult = {
  ok?: boolean;
  created?: number;
  skipped?: number;
  updated?: number;
  errors?: string[];
  message?: string;
  preview?: CmsImportPreview;
};

type Props = {
  onImported?: () => void | Promise<void>;
};

export default function CmsBulkImportPanel({ onImported }: Props) {
  const [preview, setPreview] = useState<CmsImportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<Set<CmsDocType>>(() => new Set(ALL_TYPES));
  const [publish, setPublish] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);
  const [includeRichHtml, setIncludeRichHtml] = useState(true);
  const [includeI18nStubs, setIncludeI18nStubs] = useState(false);

  const docTypes = useMemo(() => [...selectedTypes], [selectedTypes]);

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const params = new URLSearchParams();
      if (!skipExisting) params.set("force", "1");
      if (docTypes.length > 0 && docTypes.length < ALL_TYPES.length) {
        params.set("docTypes", docTypes.join(","));
      }
      const query = params.toString();
      const res = await fetch(
        `/api/admin/content/documents/bulk-import${query ? `?${query}` : ""}`
      );
      const json = (await res.json()) as { preview?: CmsImportPreview; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось загрузить preview");
      setPreview(json.preview ?? null);
    } catch {
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [docTypes, skipExisting]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  function toggleType(docType: CmsDocType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(docType)) next.delete(docType);
      else next.add(docType);
      return next;
    });
  }

  async function runImport() {
    if (selectedTypes.size === 0) {
      alert("Выберите хотя бы один тип контента");
      return;
    }

    const actionLabel = skipExisting ? "пропустить существующие" : "перезаписать существующие";
    const confirmed = window.confirm(
      `Импортировать ${docTypes.length === ALL_TYPES.length ? "все" : docTypes.length} тип(а) из TS?\n` +
        `Статус: ${publish ? "опубликовать" : "черновики"}. Режим: ${actionLabel}.`
    );
    if (!confirmed) return;

    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/content/documents/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docTypes,
          publish,
          skipExisting,
          includeRichHtml,
          includeI18nStubs,
        }),
      });
      const json = (await res.json()) as ImportResult;
      setResult(json);
      if (json.preview) setPreview(json.preview);
      if (!res.ok && res.status !== 207) {
        throw new Error(json.message ?? "Ошибка импорта");
      }
      await onImported?.();
    } catch (importError) {
      alert(importError instanceof Error ? importError.message : "Ошибка импорта");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className={`${cabinetCardClass} space-y-4 p-5`}>
      <div>
        <h2 className="font-heading text-lg font-bold text-charcoal">Массовый импорт из TS (E1)</h2>
        <p className="mt-1 text-sm text-slate">
          Идемпотентный импорт из <code className="text-xs">src/data/*</code> в{" "}
          <code className="text-xs">content_documents</code>. Legal/guide получают{" "}
          <code className="text-xs">section.html</code> для rich-text редактора.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {ALL_TYPES.map((docType) => (
          <label key={docType} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedTypes.has(docType)}
              onChange={() => toggleType(docType)}
            />
            {CMS_IMPORT_TYPE_LABELS[docType]}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Опубликовать сразу
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={skipExisting}
            onChange={(e) => setSkipExisting(e.target.checked)}
          />
          Пропускать существующие
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeRichHtml}
            onChange={(e) => setIncludeRichHtml(e.target.checked)}
          />
          Rich HTML для legal/guide
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeI18nStubs}
            onChange={(e) => setIncludeI18nStubs(e.target.checked)}
          />
          ES/EN заготовки (top-10)
        </label>
      </div>

      {loadingPreview ? (
        <p className="text-sm text-slate">Загрузка статистики…</p>
      ) : preview ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-4 py-2 font-medium">Тип</th>
                <th className="px-4 py-2 font-medium">TS</th>
                <th className="px-4 py-2 font-medium">В CMS</th>
                <th className="px-4 py-2 font-medium">Published</th>
                <th className="px-4 py-2 font-medium">Нет в CMS</th>
                <th className="px-4 py-2 font-medium">
                  {skipExisting ? "Будет создано" : "Созд./обнов."}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {preview.byType.map((row) => (
                <tr key={row.docType}>
                  <td className="px-4 py-2 font-medium text-charcoal">{row.label}</td>
                  <td className="px-4 py-2 text-slate">{row.tsCount}</td>
                  <td className="px-4 py-2 text-slate">{row.cmsTotal}</td>
                  <td className="px-4 py-2 text-slate">{row.cmsPublished}</td>
                  <td className="px-4 py-2 text-slate">{row.missingSlugs.length}</td>
                  <td className="px-4 py-2 font-semibold text-charcoal">
                    {skipExisting ? row.wouldCreate : `${row.wouldCreate} / ${row.wouldUpdate}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-gray-100 px-4 py-2 text-xs text-slate">
            Всего в TS: {preview.totalTs}.{" "}
            {skipExisting
              ? `Будет создано: ${preview.wouldCreate}, пропущено: ${preview.wouldSkip}.`
              : `Будет создано: ${preview.wouldCreate}, обновлено: ${preview.wouldUpdate}.`}
          </p>
        </div>
      ) : (
        <p className="text-sm text-red-600">Не удалось загрузить статистику импорта.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button disabled={importing || loadingPreview || selectedTypes.size === 0} onClick={() => void runImport()}>
          {importing ? "Импорт…" : "Запустить импорт"}
        </Button>
        <Button variant="outline" disabled={loadingPreview} onClick={() => void loadPreview()}>
          Обновить статистику
        </Button>
      </div>

      {result ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            result.ok === false ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.errors?.length ? (
            <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-5 text-xs">
              {result.errors.slice(0, 20).map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
