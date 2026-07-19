"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FlaskConical, Play, Save } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import IngestionTabs from "@/components/admin/ingestion/IngestionTabs";
import { INGESTION_SOURCE_LABELS } from "@/components/admin/ingestion/IngestionSourcesView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminContext } from "@/context/AdminContext";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { IngestionSourceRecord } from "@/types/ingestion";

type Preview = { title: string; excerpt: string; sourceUrl: string | null; publishedAt: string | null; mediaCount: number };

export default function IngestionSourceDetailView({ sourceId }: { sourceId: string }) {
  const { data, loading, error, refresh } = useAdminApi<{ source: IngestionSourceRecord }>(`/api/admin/ingestion/sources/${sourceId}`);
  const { hasCapability } = useAdminContext();
  const [patch, setPatch] = useState<Partial<IngestionSourceRecord>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualSourceUrl, setManualSourceUrl] = useState("");
  const source = data?.source;

  function value<K extends keyof IngestionSourceRecord>(key: K): IngestionSourceRecord[K] | undefined {
    return patch[key] ?? source?.[key];
  }

  function connectionAddress(): string {
    const config = patch.connectionConfig ?? source?.connectionConfig;
    return config?.url ?? config?.feedUrl ?? config?.sitemapUrl ?? config?.channel ?? config?.channelId ?? "";
  }

  function updateAddress(address: string) {
    if (!source) return;
    const config = { ...(patch.connectionConfig ?? source.connectionConfig) };
    if (source.sourceType === "telegram") config.channel = address;
    else if (source.sourceType === "rss") config.feedUrl = address;
    else if (source.sourceType === "sitemap") config.sitemapUrl = address;
    else if (source.sourceType === "youtube") config.channelId = address;
    else config.url = address;
    setPatch((current) => ({ ...current, connectionConfig: config }));
  }

  async function request(url: string, body?: Record<string, unknown>) {
    setBusy(true); setFeedback(null);
    try {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
      const result = await response.json() as { error?: string; health?: { message: string }; preview?: Preview[] };
      if (!response.ok) throw new Error(result.error ?? result.health?.message ?? "Действие не выполнено");
      setFeedback(result.health?.message ?? "Готово"); setPreview(result.preview ?? []); await refresh();
    } catch (requestError) { setFeedback(requestError instanceof Error ? requestError.message : "Действие не выполнено"); }
    finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setFeedback(null);
    try {
      const response = await fetch(`/api/admin/ingestion/sources/${sourceId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Изменения не сохранены");
      setPatch({}); setFeedback("Изменения сохранены"); await refresh();
    } catch (saveError) { setFeedback(saveError instanceof Error ? saveError.message : "Изменения не сохранены"); }
    finally { setBusy(false); }
  }

  async function uploadManual() {
    setBusy(true); setFeedback(null);
    try {
      const response = await fetch(`/api/admin/ingestion/sources/${sourceId}/upload`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: manualTitle, content: manualContent, sourceUrl: manualSourceUrl }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Материал не принят");
      setManualTitle(""); setManualContent(""); setManualSourceUrl(""); setFeedback("Материал отправлен в очередь редактора"); await refresh();
    } catch (uploadError) { setFeedback(uploadError instanceof Error ? uploadError.message : "Материал не принят"); }
    finally { setBusy(false); }
  }

  return (
    <CapabilityGate capability="sources.view">
      <AdminPageShell>
        <AdminPageHeader title={source?.name ?? "Источник"} subtitle={source ? INGESTION_SOURCE_LABELS[source.sourceType] : "Загрузка"} actions={<div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy || loading} onClick={() => void request(`/api/admin/ingestion/sources/${sourceId}/test`)}><FlaskConical className="h-4 w-4" />Проверить</Button><Button size="sm" disabled={busy || !source?.enabled} onClick={() => void request(`/api/admin/ingestion/sources/${sourceId}/run`)}><Play className="h-4 w-4" />Запустить</Button></div>} />
        <IngestionTabs />
        <Link href="/admin/ingestion/sources" className="inline-flex items-center gap-2 text-sm font-medium text-sky"><ArrowLeft className="h-4 w-4" />К списку источников</Link>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {feedback ? <p role="status" className="text-sm text-muted">{feedback}</p> : null}

        {source ? (
          <section className={`${cabinetCardClass} divide-y divide-border-subtle`}>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2"><h2 className="font-semibold">Общая информация</h2></div>
              <label className="space-y-1 text-sm font-medium">Название<Input value={String(value("name") ?? "")} onChange={(event) => setPatch((current) => ({ ...current, name: event.target.value }))} /></label>
              <label className="space-y-1 text-sm font-medium">Язык<Input value={String(value("language") ?? "ru")} onChange={(event) => setPatch((current) => ({ ...current, language: event.target.value }))} /></label>
              <label className="space-y-1 text-sm font-medium">Регион<Input value={String(value("region") ?? "")} onChange={(event) => setPatch((current) => ({ ...current, region: event.target.value }))} /></label>
              <label className="space-y-1 text-sm font-medium">Категории<Input value={(value("categories") ?? []).join(", ")} onChange={(event) => setPatch((current) => ({ ...current, categories: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} /></label>
              <label className="space-y-1 text-sm font-medium md:col-span-2">Описание<Textarea value={String(value("description") ?? "")} onChange={(event) => setPatch((current) => ({ ...current, description: event.target.value }))} /></label>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2"><h2 className="font-semibold">Подключение и правила</h2></div>
              <label className="space-y-1 text-sm font-medium">Адрес или канал<Input value={connectionAddress()} onChange={(event) => updateAddress(event.target.value)} /></label>
              <label className="space-y-1 text-sm font-medium">Защищённое подключение<Input disabled={!hasCapability("source_credentials.manage")} value={String(value("credentialRef") ?? "")} onChange={(event) => setPatch((current) => ({ ...current, credentialRef: event.target.value.toUpperCase() }))} /></label>
              <label className="space-y-1 text-sm font-medium">Разрешённые пути<Input value={(value("connectionConfig")?.allowedPaths ?? []).join(", ")} onChange={(event) => setPatch((current) => ({ ...current, connectionConfig: { ...(current.connectionConfig ?? source.connectionConfig), allowedPaths: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } }))} /></label>
              <label className="space-y-1 text-sm font-medium">Исключённые пути<Input value={(value("connectionConfig")?.blockedPaths ?? []).join(", ")} onChange={(event) => setPatch((current) => ({ ...current, connectionConfig: { ...(current.connectionConfig ?? source.connectionConfig), blockedPaths: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } }))} /></label>
              <label className="space-y-1 text-sm font-medium md:col-span-2">Правовые примечания<Textarea value={String(value("legalNotes") ?? "")} onChange={(event) => setPatch((current) => ({ ...current, legalNotes: event.target.value }))} /></label>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div className="md:col-span-3"><h2 className="font-semibold">Расписание и обработка</h2></div>
              <label className="space-y-1 text-sm font-medium">Режим<NativeSelect value={String(value("scheduleKind") ?? "manual")} onChange={(event) => setPatch((current) => ({ ...current, scheduleKind: event.target.value as IngestionSourceRecord["scheduleKind"] }))}><option value="manual">Вручную</option><option value="cron">По расписанию</option><option value="interval">Через интервал</option><option value="webhook">По сигналу</option></NativeSelect></label>
              <label className="space-y-1 text-sm font-medium">Выражение<Input value={String(value("scheduleExpression") ?? "")} onChange={(event) => setPatch((current) => ({ ...current, scheduleExpression: event.target.value }))} /></label>
              <label className="space-y-1 text-sm font-medium">Приоритет<Input type="number" min={0} max={100} value={Number(value("priority") ?? 50)} onChange={(event) => setPatch((current) => ({ ...current, priority: Number(event.target.value) }))} /></label>
              <label className="space-y-1 text-sm font-medium">Доверие<Input type="number" min={0} max={100} value={Number(value("trustLevel") ?? 50)} onChange={(event) => setPatch((current) => ({ ...current, trustLevel: Number(event.target.value) }))} /></label>
              <label className="space-y-1 text-sm font-medium">Запросов в минуту<Input type="number" min={1} max={600} value={Number(value("rateLimitPerMinute") ?? 30)} onChange={(event) => setPatch((current) => ({ ...current, rateLimitPerMinute: Number(event.target.value) }))} /></label>
              <label className="space-y-1 text-sm font-medium">Тайм-аут, сек.<Input type="number" min={5} max={300} value={Number(value("timeoutSeconds") ?? 30)} onChange={(event) => setPatch((current) => ({ ...current, timeoutSeconds: Number(event.target.value) }))} /></label>
            </div>
            <div className="flex flex-wrap items-center gap-3 p-5"><Button disabled={busy || !Object.keys(patch).length} onClick={() => void save()}><Save className="h-4 w-4" />Сохранить</Button><Link href={`/admin/ingestion/runs?source=${source.id}`} className="text-sm font-medium text-sky">История запусков</Link><span className="text-xs text-muted">Последняя проверка: {source.lastTestedAt ? new Date(source.lastTestedAt).toLocaleString("ru-RU") : "не проводилась"}</span></div>
          </section>
        ) : null}

        {source?.sourceType === "manual" ? (
          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            <h2 className="font-semibold">Добавить материал</h2>
            <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm font-medium">Заголовок<Input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} /></label><label className="space-y-1 text-sm font-medium">Ссылка на первоисточник<Input type="url" value={manualSourceUrl} onChange={(event) => setManualSourceUrl(event.target.value)} placeholder="https://…" /></label></div>
            <label className="block space-y-1 text-sm font-medium">Текст<Textarea className="min-h-48" value={manualContent} onChange={(event) => setManualContent(event.target.value)} /></label>
            <Button disabled={busy || manualContent.trim().length < 20} onClick={() => void uploadManual()}>Отправить на обработку</Button>
          </section>
        ) : null}

        {preview.length ? <section className={`${cabinetCardClass} p-5`}><h2 className="font-semibold">Предпросмотр</h2><div className="mt-4 divide-y divide-border-subtle">{preview.map((item) => <article key={`${item.sourceUrl}:${item.title}`} className="py-4"><h3 className="text-sm font-medium">{item.title}</h3><p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{item.excerpt || "Текст отсутствует"}</p><p className="mt-2 text-xs text-muted">{item.publishedAt ? new Date(item.publishedAt).toLocaleString("ru-RU") : "Дата не указана"} · медиа: {item.mediaCount}</p></article>)}</div></section> : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
