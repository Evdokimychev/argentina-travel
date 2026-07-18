"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type WaitlistStatus = "waiting" | "contacted" | "offered" | "converted" | "closed" | "cancelled";
type WaitlistItem = {
  id: string;
  tourId: string;
  tour?: { title?: string; slug?: string } | null;
  email: string | null;
  contactName: string | null;
  contactPhone: string | null;
  slotDate: string | null;
  guests: number;
  status: WaitlistStatus;
  note: string | null;
  version: number;
  createdAt: string;
};
type WaitlistResponse = { items?: WaitlistItem[] };

const STATUS_LABELS: Record<WaitlistStatus, string> = {
  waiting: "Новые",
  contacted: "Связались",
  offered: "Предложили место",
  converted: "Стали бронированием",
  closed: "Закрыты",
  cancelled: "Отменены",
};

export default function AdminWaitlistView() {
  const [status, setStatus] = useState<WaitlistStatus>("waiting");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const { data, loading, error, refresh } = useAdminApi<WaitlistResponse>(`/api/admin/ops/waitlist?status=${status}`);
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  async function transition(item: WaitlistItem, nextStatus: WaitlistStatus) {
    setBusyId(item.id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/ops/waitlist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, version: item.version }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Изменение не сохранено");
      setFeedback({ variant: "success", message: "Статус сохранён. Запись назначена вам." });
      await refresh();
    } catch (transitionError) {
      setFeedback({ variant: "error", message: transitionError instanceof Error ? transitionError.message : "Обновите очередь" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <CapabilityGate capability="operations.bookings">
      <AdminPageShell>
        <AdminPageHeader
          title="Лист ожидания"
          subtitle="Заявки на занятые даты: связаться, предложить освободившееся место и закрыть результат"
          actions={
            <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as WaitlistStatus)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </NativeSelect>
          }
        />
        {error ? <InlineFeedback variant="error" title="Очередь недоступна" description="Не принимайте решения по старым данным — обновите страницу." /> : null}
        {feedback ? <InlineFeedback variant={feedback.variant} title={feedback.variant === "success" ? "Готово" : "Не удалось"} description={feedback.message} /> : null}
        <section className={`${cabinetCardClass} overflow-hidden`}>
          {loading ? <p className="p-5 text-sm text-slate">Загружаем заявки…</p> : items.length === 0 ? (
            <p className="p-5 text-sm text-slate">В этой очереди заявок нет.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {items.map((item) => (
                <li key={item.id} className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.tour?.title ?? `Тур ${item.tourId}`}</p>
                      <p className="mt-1 text-sm text-slate">Дата: {item.slotDate ?? "не выбрана"} · гостей: {item.guests} · заявка {formatAdminWhen(item.createdAt)}</p>
                      <p className="mt-1 text-sm text-slate">{item.contactName ?? "Без имени"} · {item.email ?? item.contactPhone ?? "контакт в профиле"}</p>
                    </div>
                    {item.tour?.slug ? <Link className="text-sm font-medium text-sky hover:underline" href={`/tours/${item.tour.slug}`} target="_blank">Открыть тур</Link> : null}
                  </div>
                  {item.note ? <p className="rounded-lg bg-surface-muted p-3 text-sm text-slate">{item.note}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    {item.status === "waiting" ? <Button size="sm" onClick={() => void transition(item, "contacted")} disabled={busyId === item.id}>Отметить: связались</Button> : null}
                    {item.status === "contacted" ? <Button size="sm" onClick={() => void transition(item, "offered")} disabled={busyId === item.id}>Место предложено</Button> : null}
                    {!(["converted", "closed", "cancelled"] as WaitlistStatus[]).includes(item.status) ? <Button size="sm" variant="outline" onClick={() => void transition(item, "closed")} disabled={busyId === item.id}>Закрыть</Button> : null}
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
