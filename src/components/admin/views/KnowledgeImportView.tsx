"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileJson, Upload } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { Button } from "@/components/ui/button";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";

type PreviewItem = {
  id: string;
  cmsId: string;
  title: string;
  summary: string;
  editorialStatus: string;
  qualityScore: number;
  source: string;
  sourceId: string;
  category?: string;
  province?: string;
  city?: string;
  flags: string[];
  alreadyImported: boolean;
};

type PreviewResponse = {
  package: { exportId: string; generatedAt: string; producer: string };
  preview: PreviewItem[];
  validationErrors: Array<{ index?: number; id?: string; message: string }>;
};

type ImportResponse = {
  created?: Array<{ id: string; title: string }>;
  skipped?: Array<{ id: string; reason: string }>;
  error?: string;
  message?: string;
};

const STATUS_LABELS: Record<string, string> = {
  review: "Нужна проверка",
  accepted: "Отобран",
  ready: "Готов",
};

const FLAG_LABELS: Record<string, string> = {
  promotional_language: "рекламные формулировки",
  time_sensitive_content_may_be_stale: "проверить актуальность",
  source_attribution_incomplete: "неполное указание источника",
};

export default function KnowledgeImportView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawPackage, setRawPackage] = useState<unknown>(null);
  const [data, setData] = useState<PreviewResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [created, setCreated] = useState<Array<{ id: string; title: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadInventory() {
      setBusy(true);
      try {
        const response = await fetch("/api/admin/content/knowledge-import");
        const payload = (await response.json()) as PreviewResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Не удалось загрузить базу знаний");
        if (!cancelled) {
          setData(payload);
          setRawPackage(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void loadInventory();
    return () => {
      cancelled = true;
    };
  }, []);

  async function readPackage(file: File) {
    setBusy(true);
    setError(null);
    setCreated([]);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const response = await fetch("/api/admin/content/knowledge-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", package: parsed }),
      });
      const payload = (await response.json()) as PreviewResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Пакет не прошёл проверку");

      setRawPackage(parsed);
      setData(payload);
      setSelected(
        new Set(
          payload.preview
            .filter((item) => !item.alreadyImported)
            .slice(0, 100)
            .map((item) => item.id),
        ),
      );
    } catch (readError) {
      setRawPackage(null);
      setData(null);
      setSelected(new Set());
      setError(readError instanceof Error ? readError.message : "Не удалось прочитать пакет");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function importSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/content/knowledge-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          rawPackage
            ? { action: "import", package: rawPackage, selectedIds: [...selected] }
            : { action: "import_static", selectedIds: [...selected] },
        ),
      });
      const payload = (await response.json()) as ImportResponse;
      if (!response.ok) throw new Error(payload.error ?? "Не удалось создать черновики");
      const imported = payload.created ?? [];
      const importedIds = new Set(imported.map((document) => document.id));
      setCreated(imported);
      setData((current) =>
        current
          ? {
              ...current,
              preview: current.preview.map((item) => ({
                ...item,
                alreadyImported: item.alreadyImported || importedIds.has(item.cmsId),
              })),
            }
          : current
      );
      setSelected(new Set());
      if (payload.skipped?.length) setError(`Пропущено материалов: ${payload.skipped.length}`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Ошибка импорта");
    } finally {
      setBusy(false);
    }
  }

  const availableCount = data?.preview.filter((item) => !item.alreadyImported).length ?? 0;

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="База знаний"
          subtitle="Отобранные материалы из Argentina Knowledge Collector"
          actions={
            <>
              <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readPackage(file);
                }}
              />
              <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" aria-hidden />
                Выбрать пакет
              </Button>
              <Button disabled={busy || selected.size === 0} onClick={() => void importSelected()}>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                В черновики ({selected.size})
              </Button>
            </>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {data ? (
          <section className="grid gap-4 sm:grid-cols-3">
            <div className={cabinetStatCardClass}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate">В пакете</p>
              <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{data.preview.length}</p>
            </div>
            <div className={cabinetStatCardClass}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate">Новые</p>
              <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{availableCount}</p>
            </div>
            <div className={cabinetStatCardClass}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate">Ошибки проверки</p>
              <p className="mt-2 font-heading text-2xl font-bold text-charcoal">{data.validationErrors.length}</p>
            </div>
          </section>
        ) : null}

        {created.length ? (
          <section className={`${cabinetCardClass} p-5`}>
            <h2 className="font-heading text-lg font-bold text-charcoal">Созданные черновики</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {created.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="font-medium text-charcoal">{document.title}</span>
                  <Link
                    href={`/admin/content/documents/${encodeURIComponent(document.id)}`}
                    className="text-sky hover:underline"
                  >
                    Открыть в редакторе
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-charcoal">Кандидаты</h2>
                <p className="mt-1 text-xs text-slate">Пакет {data.package.exportId}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setSelected(
                    new Set(
                      data.preview
                        .filter((item) => !item.alreadyImported)
                        .slice(0, 100)
                        .map((item) => item.id),
                    ),
                  )
                }
              >
                Выбрать до 100 новых
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-slate">
                    <th className="w-12 px-5 py-3 font-medium" aria-label="Выбор" />
                    <th className="px-3 py-3 font-medium">Материал</th>
                    <th className="px-3 py-3 font-medium">Оценка</th>
                    <th className="px-3 py-3 font-medium">Источник</th>
                    <th className="px-3 py-3 font-medium">География</th>
                    <th className="px-5 py-3 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.preview.map((item) => (
                    <tr key={item.id} className={item.alreadyImported ? "opacity-55" : undefined}>
                      <td className="px-5 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          disabled={item.alreadyImported}
                          onChange={() => toggle(item.id)}
                          aria-label={`Выбрать ${item.title}`}
                        />
                      </td>
                      <td className="max-w-xl px-3 py-4 align-top">
                        <p className="font-medium text-charcoal">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate">{item.summary}</p>
                        {item.flags.length ? (
                          <p className="mt-2 text-xs text-amber-700">
                            Требует проверки: {item.flags.map((flag) => FLAG_LABELS[flag] ?? flag).join(", ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 align-top font-semibold text-charcoal">{item.qualityScore}/100</td>
                      <td className="px-3 py-4 align-top text-slate">{item.source}:{item.sourceId}</td>
                      <td className="px-3 py-4 align-top text-slate">{item.city || item.province || "—"}</td>
                      <td className="px-5 py-4 align-top">
                        {item.alreadyImported ? "Уже в CMS" : STATUS_LABELS[item.editorialStatus] ?? item.editorialStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className={`${cabinetCardClass} flex min-h-64 flex-col items-center justify-center p-8 text-center`}>
            <FileJson className="h-10 w-10 text-slate" aria-hidden />
            <p className="mt-4 font-medium text-charcoal">Пакет материалов не выбран</p>
          </section>
        )}
      </AdminPageShell>
    </CapabilityGate>
  );
}
