"use client";
import { AlertTriangle, CheckCircle2, Clock3, DatabaseZap, RefreshCw, type LucideIcon } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import IngestionTabs from "@/components/admin/ingestion/IngestionTabs";
import { Button } from "@/components/ui/button";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { IngestionOverview } from "@/types/ingestion";

export default function IngestionOverviewView() {
  const { data, loading, error, refresh } = useAdminApi<{ overview: IngestionOverview }>("/api/admin/ingestion/overview"); const value = data?.overview;
  const stats: Array<{ label: string; count: number; Icon: LucideIcon; tone: string }> = [
    { label: "Активные источники", count: value?.sources.active ?? 0, Icon: DatabaseZap, tone: "text-sky" },
    { label: "Ждут редактора", count: value?.candidates.awaitingModeration ?? 0, Icon: Clock3, tone: "text-amber-700" },
    { label: "Обработано сегодня", count: value?.runs.today ?? 0, Icon: CheckCircle2, tone: "text-emerald-700" },
    { label: "Требуют внимания", count: (value?.sources.problematic ?? 0) + (value?.runs.failed ?? 0), Icon: AlertTriangle, tone: "text-red-700" },
  ];
  return <CapabilityGate capability="sources.view"><AdminPageShell><AdminPageHeader title="Сбор и обработка данных" subtitle="Единый конвейер материалов для Argentina Travel" actions={<Button variant="outline" size="sm" disabled={loading} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" aria-hidden />Обновить</Button>} /><IngestionTabs />{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    <section className={`${cabinetCardClass} overflow-hidden`}><div className="grid divide-y divide-border-subtle md:grid-cols-4 md:divide-x md:divide-y-0">{stats.map(({ label, count, Icon, tone }) => <div key={label} className="flex min-h-24 items-center gap-3 p-4"><Icon className={`h-5 w-5 ${tone}`} aria-hidden /><div><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-bold text-foreground">{count}</p></div></div>)}</div></section>
    <section className="grid gap-5 lg:grid-cols-2"><div className={`${cabinetCardClass} p-5`}><h2 className="text-base font-semibold text-foreground">Работа конвейера</h2><dl className="mt-4 divide-y divide-border-subtle text-sm"><div className="flex justify-between py-3"><dt className="text-muted">Сейчас выполняются</dt><dd className="font-semibold">{value?.runs.running ?? 0}</dd></div><div className="flex justify-between py-3"><dt className="text-muted">Среднее время обработки</dt><dd className="font-semibold">{value?.runs.averageDurationMs ? `${Math.round(value.runs.averageDurationMs / 1000)} сек.` : "—"}</dd></div><div className="flex justify-between py-3"><dt className="text-muted">Никогда не завершались успешно</dt><dd className="font-semibold">{value?.sources.neverSucceeded ?? 0}</dd></div><div className="flex justify-between py-3"><dt className="text-muted">Найдено повторов</dt><dd className="font-semibold">{value?.candidates.duplicates ?? 0}</dd></div><div className="flex justify-between py-3"><dt className="text-muted">Передано в CMS</dt><dd className="font-semibold">{value?.candidates.published ?? 0}</dd></div></dl></div><div className={`${cabinetCardClass} p-5`}><h2 className="text-base font-semibold text-foreground">Состояние подключений</h2><ul className="mt-4 divide-y divide-border-subtle text-sm">{[["Планировщик", value?.health.scheduler], ["Закрытое хранилище", value?.health.storage], ["AI-анализ", value?.health.aiProvider], ["Telegram", value?.health.telegram], ["Сайты и ленты", value?.health.websites]].map(([label, ok]) => <li key={String(label)} className="flex justify-between py-2"><span className="text-muted">{label}</span><span className={ok ? "text-emerald-700" : "text-amber-700"}>{ok ? "Готово" : "Нужна настройка"}</span></li>)}</ul><p className="mt-4 text-xs text-muted">Последний сигнал: {value?.lastHeartbeatAt ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value.lastHeartbeatAt)) : "запусков ещё не было"} · зависших задач: {value?.health.stuckJobs ?? 0}</p></div></section>
  </AdminPageShell></CapabilityGate>;
}
