"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type QueueItem = {
  id: string;
  subject: string;
  status: "pending" | "sending" | "delivered" | "failed" | "dead";
  attempts: number;
  lastError: string | null;
  createdAt: string;
  recipientCount: number;
};

type QueueResponse = { items?: QueueItem[]; generatedAt?: string };

const STATUS_LABELS: Record<string, string> = {
  "": "Все состояния",
  pending: "Ожидают отправки",
  sending: "Отправляются",
  delivered: "Доставлены провайдеру",
  failed: "Будут повторены",
  dead: "Требуют решения",
};

export default function AdminEmailQueueView() {
  const [status, setStatus] = useState("failed");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const { data, loading, error, refresh } = useAdminApi<QueueResponse>(`/api/admin/ops/email-outbox?status=${status}`);
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  async function runAction(action: "retry_due" | "retry_selected" | "requeue_dead") {
    const description = action === "retry_due"
      ? "Повторить все письма, срок отправки которых уже наступил? Это сразу обратится к почтовой службе."
      : action === "requeue_dead"
        ? `Вернуть выбранные письма в очередь и сразу повторить отправку (${selected.length})?`
        : `Сразу повторить отправку выбранных писем (${selected.length})?`;
    if (!window.confirm(description)) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/ops/email-outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: selected, confirm: true }),
      });
      const payload = (await response.json()) as { error?: string; result?: { delivered: number; failed: number } };
      if (!response.ok) throw new Error(payload.error ?? "Операция не выполнена");
      setFeedback({
        variant: "success",
        message: `Доставлено: ${payload.result?.delivered ?? 0}. Осталось с ошибкой: ${payload.result?.failed ?? 0}.`,
      });
      setSelected([]);
      await refresh();
    } catch (actionError) {
      setFeedback({ variant: "error", message: actionError instanceof Error ? actionError.message : "Попробуйте ещё раз" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <CapabilityGate capability="operations.email">
      <AdminPageShell>
        <AdminPageHeader
          title="Очередь писем"
          subtitle="Безопасное восстановление отправки: адреса и содержимое писем здесь не показываются"
          actions={
            <NativeSelect value={status} onChange={(event) => { setStatus(event.target.value); setSelected([]); }}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </NativeSelect>
          }
        />

        {error ? <InlineFeedback variant="error" title="Очередь недоступна" description="Старые данные не используются. Обновите страницу или проверьте состояние базы." /> : null}
        {feedback ? <InlineFeedback variant={feedback.variant} title={feedback.variant === "success" ? "Готово" : "Не удалось"} description={feedback.message} /> : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void runAction("retry_due")} disabled={busy}>Повторить письма по расписанию</Button>
          <Button variant="outline" onClick={() => void runAction("retry_selected")} disabled={busy || selected.length === 0}>Повторить выбранные</Button>
          <Button variant="outline" onClick={() => void runAction("requeue_dead")} disabled={busy || selected.length === 0}>Вернуть выбранные в очередь</Button>
        </div>

        <section className={`${cabinetCardClass} overflow-hidden`}>
          {loading ? <p className="p-5 text-sm text-slate">Загружаем очередь…</p> : items.length === 0 ? (
            <p className="p-5 text-sm text-slate">В этом состоянии писем нет.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 p-4">
                  <input
                    aria-label={`Выбрать письмо ${item.subject}`}
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">{item.subject}</p>
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-slate">{STATUS_LABELS[item.status]}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate">Создано {formatAdminWhen(item.createdAt)} · получателей: {item.recipientCount} · попыток: {item.attempts}</p>
                    {item.lastError ? <p className="mt-2 text-xs text-red-700">Последняя безопасная причина: {item.lastError}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
