"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CirclePause, CirclePlay, FlaskConical, Plus, RefreshCw, Search } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import IngestionTabs from "@/components/admin/ingestion/IngestionTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import type { IngestionSourceRecord, IngestionSourceType } from "@/types/ingestion";

export const INGESTION_SOURCE_LABELS: Record<IngestionSourceType, string> = {
  telegram: "Telegram",
  website: "Страница сайта",
  rss: "RSS / Atom",
  sitemap: "Карта сайта",
  json_api: "JSON API",
  youtube: "YouTube",
  manual: "Ручной материал",
};

function sourceAddress(source: IngestionSourceRecord): string {
  return source.connectionConfig.url ?? source.connectionConfig.feedUrl ?? source.connectionConfig.channel ?? source.connectionConfig.channelId ?? "Ручной источник";
}

export default function IngestionSourcesView() {
  const { data, loading, error, refresh } = useAdminApi<{ sources: IngestionSourceRecord[] }>("/api/admin/ingestion/sources");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<IngestionSourceType>("website");
  const [address, setAddress] = useState("");
  const [credentialRef, setCredentialRef] = useState("");
  const [schedule, setSchedule] = useState("0 */6 * * *");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<IngestionSourceType | "all">("all");

  const filteredSources = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    return (data?.sources ?? []).filter((source) =>
      (typeFilter === "all" || source.sourceType === typeFilter) &&
      `${source.name} ${source.region ?? ""} ${source.categories.join(" ")}`.toLocaleLowerCase("ru").includes(query)
    );
  }, [data?.sources, search, typeFilter]);

  async function action(url: string, init: RequestInit, key: string) {
    setBusy(key); setFeedback(null);
    try {
      const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init.headers } });
      const result = await response.json() as { error?: string; health?: { message: string } };
      if (!response.ok) throw new Error(result.error ?? result.health?.message ?? "Действие не выполнено");
      setFeedback(result.health?.message ?? "Готово"); await refresh(); return true;
    } catch (actionError) {
      setFeedback(actionError instanceof Error ? actionError.message : "Действие не выполнено"); return false;
    } finally { setBusy(null); }
  }

  async function create() {
    const connectionConfig = type === "manual" ? {} : type === "telegram" ? { channel: address, telegramMode: "mtproto" } : type === "youtube" ? (address.startsWith("http") ? { feedUrl: address } : { channelId: address }) : type === "rss" ? { feedUrl: address } : type === "sitemap" ? { sitemapUrl: address } : { url: address };
    const ok = await action("/api/admin/ingestion/sources", { method: "POST", body: JSON.stringify({ name, sourceType: type, connectionConfig, credentialRef: credentialRef || null, scheduleKind: "cron", scheduleExpression: schedule, enabled: false, status: "draft", language: "ru", region: "Argentina", categories: ["travel"] }) }, "create");
    if (ok) { setOpen(false); setName(""); setAddress(""); }
  }

  return (
    <CapabilityGate capability="sources.view">
      <AdminPageShell>
        <AdminPageHeader title="Источники материалов" subtitle="Подключения к Telegram, сайтам, лентам и YouTube" actions={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className="h-4 w-4" aria-hidden />Обновить</Button><Button size="sm" onClick={() => setOpen((value) => !value)}><Plus className="h-4 w-4" aria-hidden />Добавить</Button></div>} />
        <IngestionTabs />
        {feedback ? <p className="text-sm text-muted" role="status">{feedback}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {open ? (
          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            <h2 className="text-base font-semibold">Новый источник</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-medium">Название<Input value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="space-y-1 text-sm font-medium">Тип<NativeSelect value={type} onChange={(event) => setType(event.target.value as IngestionSourceType)}>{Object.entries(INGESTION_SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></label>
              {type !== "manual" ? <label className="space-y-1 text-sm font-medium">{type === "telegram" ? "Канал" : type === "youtube" ? "ID канала или адрес ленты" : "Адрес"}<Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder={type === "telegram" ? "@vista_argentina" : "https://…"} /></label> : <div className="text-sm text-muted">Текст добавляется в карточке источника после его сохранения.</div>}
              <label className="space-y-1 text-sm font-medium">Защищённое подключение<Input value={credentialRef} onChange={(event) => setCredentialRef(event.target.value.toUpperCase())} placeholder="ARGENTINA_TELEGRAM" /><span className="block text-xs font-normal text-muted">Только имя набора секретов, без токенов и паролей</span></label>
              <label className="space-y-1 text-sm font-medium">Расписание<Input value={schedule} onChange={(event) => setSchedule(event.target.value)} /></label>
            </div>
            <div className="flex gap-2"><Button disabled={busy === "create" || !name.trim() || (type !== "manual" && !address.trim())} onClick={() => void create()}>Сохранить выключенным</Button><Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button></div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-64 flex-1"><span className="sr-only">Поиск источников</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название, регион или категория" /></label>
          <NativeSelect aria-label="Тип источника" className="w-full sm:w-56" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as IngestionSourceType | "all")}><option value="all">Все типы</option>{Object.entries(INGESTION_SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect>
        </div>

        <div className={cabinetTableWrapClass}>
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-surface-muted"><tr><th className="p-3">Источник</th><th className="p-3">Тип</th><th className="p-3">Язык и категории</th><th className="p-3">Состояние</th><th className="p-3">Расписание</th><th className="p-3">Последний успех</th><th className="p-3">Следующий запуск</th><th className="p-3 text-right">Действия</th></tr></thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSources.map((source) => (
                <tr key={source.id}>
                  <td className="p-3"><Link href={`/admin/ingestion/sources/${source.id}`} className="font-medium text-foreground hover:text-sky">{source.name}</Link><p className="mt-1 text-xs text-muted">{sourceAddress(source)}</p></td>
                  <td className="p-3">{INGESTION_SOURCE_LABELS[source.sourceType]}</td>
                  <td className="p-3"><p>{source.language.toUpperCase()}</p><p className="mt-1 max-w-48 truncate text-xs text-muted">{source.categories.join(", ") || "Без категории"}</p></td>
                  <td className="p-3"><span className={`font-medium ${source.enabled ? "text-emerald-700" : "text-muted"}`}>{source.enabled ? "Включён" : "Выключен"}</span><p className="mt-1 text-xs text-muted">{source.lastTestOk ? "Связь проверена" : "Нужна проверка"}</p>{source.lastError ? <p className="mt-1 max-w-64 text-xs text-red-700">{source.lastError}</p> : null}</td>
                  <td className="p-3 text-muted">{source.scheduleExpression ?? "Вручную"}</td>
                  <td className="p-3 text-muted">{source.lastSuccessAt ? new Date(source.lastSuccessAt).toLocaleString("ru-RU") : "—"}</td>
                  <td className="p-3 text-muted">{source.nextRunAt ? new Date(source.nextRunAt).toLocaleString("ru-RU") : "Вручную"}</td>
                  <td className="p-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Проверить соединение" disabled={busy === source.id} onClick={() => void action(`/api/admin/ingestion/sources/${source.id}/test`, { method: "POST" }, source.id)}><FlaskConical className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title={source.enabled ? "Выключить" : "Включить"} disabled={busy === source.id} onClick={() => void action(`/api/admin/ingestion/sources/${source.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !source.enabled }) }, source.id)}>{source.enabled ? <CirclePause className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}</Button><Button variant="outline" size="sm" disabled={!source.enabled || busy === source.id} onClick={() => void action(`/api/admin/ingestion/sources/${source.id}/run`, { method: "POST", body: "{}" }, source.id)}>Запустить</Button></div></td>
                </tr>
              ))}
              {!loading && !filteredSources.length ? <tr><td colSpan={8} className="p-8 text-center text-muted">{data?.sources.length ? "По выбранным условиям ничего не найдено" : "Источников пока нет"}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
