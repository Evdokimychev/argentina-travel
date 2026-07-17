"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Inbox,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cabinetCardClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import type {
  ApartmentInquiryPrivate,
  ApartmentInquiryStatus,
} from "@/types/apartments";

type Role = "admin" | "organizer";
type Filter = "active" | ApartmentInquiryStatus | "all";

const STATUS_LABELS: Record<ApartmentInquiryStatus, string> = {
  awaiting_confirmation: "Новая",
  in_review: "В работе",
  confirmed: "Подтверждена",
  rejected: "Отклонена",
  cancelled: "Отменена",
};

const STATUS_STYLES: Record<ApartmentInquiryStatus, string> = {
  awaiting_confirmation: "bg-amber-50 text-amber-800",
  in_review: "bg-sky/10 text-sky",
  confirmed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-surface-muted text-slate",
};

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function nightsBetween(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  return Number.isFinite(startMs) && Number.isFinite(endMs)
    ? Math.max(0, Math.round((endMs - startMs) / 86_400_000))
    : 0;
}

function formatMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

function actionConfirmation(item: ApartmentInquiryPrivate, nextStatus: ApartmentInquiryStatus): string {
  if (nextStatus === "confirmed") {
    return `Подтвердить проживание в «${item.apartmentTitle}» с ${formatDate(item.stayStart)} по ${formatDate(item.stayEnd)}? Эти даты станут недоступны для других заявок.`;
  }
  if (nextStatus === "rejected") {
    return `Отклонить заявку ${item.guestName}? После этого вернуть её в работу нельзя.`;
  }
  if (nextStatus === "cancelled" && item.status === "confirmed") {
    return `Отменить подтверждённую заявку ${item.guestName}? Связанный с ней период снова станет доступен.`;
  }
  return `Отменить заявку ${item.guestName}?`;
}

export default function ApartmentInquiryInbox({ role }: { role: Role }) {
  const base = role === "admin"
    ? "/api/admin/apartments/inquiries"
    : "/api/organizer/apartments/inquiries";
  const [items, setItems] = useState<ApartmentInquiryPrivate[]>([]);
  const [filter, setFilter] = useState<Filter>("active");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const actionLock = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(base, { cache: "no-store", signal });
      const body = await response.json().catch(() => ({})) as {
        inquiries?: ApartmentInquiryPrivate[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "Не удалось загрузить заявки.");
      setItems(body.inquiries ?? []);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заявки.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function transition(item: ApartmentInquiryPrivate, nextStatus: ApartmentInquiryStatus) {
    if (actionLock.current) return;
    if (nextStatus !== "in_review" && !window.confirm(actionConfirmation(item, nextStatus))) return;
    actionLock.current = true;
    setBusyId(item.id);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${base}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedVersion: item.rowVersion,
          nextStatus,
          note: notes[item.id] ?? "",
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Не удалось изменить заявку.");
      setSuccess(nextStatus === "confirmed"
        ? "Заявка подтверждена, даты закрыты в календаре."
        : `Статус изменён: ${STATUS_LABELS[nextStatus].toLowerCase()}.`);
      setNotes((current) => ({ ...current, [item.id]: "" }));
      await load();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Не удалось изменить заявку.");
    } finally {
      actionLock.current = false;
      setBusyId(null);
    }
  }

  const visibleItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "active") return item.status === "awaiting_confirmation" || item.status === "in_review";
    return item.status === filter;
  });
  const activeCount = items.filter((item) => item.status === "awaiting_confirmation" || item.status === "in_review").length;

  return (
    <section className={cn(cabinetPanelClass, "mt-6")} aria-labelledby="apartment-inquiries-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-wine">Работа с гостями</p>
          <h2 id="apartment-inquiries-heading" className="mt-1 font-heading text-2xl font-bold text-foreground">
            Заявки на проживание
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">
            Сначала возьмите новую заявку в работу, уточните детали и только затем подтверждайте.
            Подтверждение закрывает даты, но не означает оплату.
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-4 py-3 text-center">
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-xs text-slate">требуют внимания</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <FormField id={`apartment-inquiry-filter-${role}`} label="Показывать">
          <NativeSelect
            id={`apartment-inquiry-filter-${role}`}
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            disabled={loading || Boolean(busyId)}
            wrapperClassName="min-w-[220px]"
          >
            <option value="active">Новые и в работе</option>
            <option value="awaiting_confirmation">Только новые</option>
            <option value="in_review">Только в работе</option>
            <option value="confirmed">Подтверждённые</option>
            <option value="rejected">Отклонённые</option>
            <option value="cancelled">Отменённые</option>
            <option value="all">Все заявки</option>
          </NativeSelect>
        </FormField>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading || Boolean(busyId)}>
          <RefreshCw className="h-4 w-4" aria-hidden />Обновить
        </Button>
      </div>

      {loading ? <InlineFeedback className="mt-4" variant="loading" title="Загружаем заявки" /> : null}
      {error ? <InlineFeedback className="mt-4" variant="error" title="Не удалось обновить данные" description={error} action={{ label: "Обновить список", onClick: () => void load() }} /> : null}
      {success ? <InlineFeedback className="mt-4" variant="success" title={success} /> : null}

      {!loading && visibleItems.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {visibleItems.map((item) => {
            const nights = nightsBetween(item.stayStart, item.stayEnd);
            const estimatedTotal = item.nightlyPriceMinorSnapshot * nights;
            const itemBusy = busyId === item.id;
            return (
              <article key={item.id} className={cn(cabinetCardClass, "overflow-hidden")}>
                <div className="border-b border-border-subtle p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{item.apartmentTitle}</p>
                      <p className="mt-1 text-xs text-slate">{item.apartmentLocality}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[item.status])}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <p className="flex items-center gap-2"><CalendarCheck2 className="h-4 w-4 text-sky" aria-hidden />{formatDate(item.stayStart)} — {formatDate(item.stayEnd)}</p>
                    <p className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-sky" aria-hidden />Гостей: {item.guests}</p>
                    <p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-sky" aria-hidden />{item.guestName}</p>
                    <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-sky" aria-hidden />{formatCreatedAt(item.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div className="rounded-xl bg-surface-muted/60 p-3 text-sm">
                    <a className="flex items-center gap-2 font-medium text-sky hover:underline" href={`mailto:${item.guestEmail}`}>
                      <Mail className="h-4 w-4" aria-hidden />{item.guestEmail}
                    </a>
                    {item.guestPhone ? (
                      <a className="mt-2 flex items-center gap-2 font-medium text-sky hover:underline" href={`tel:${item.guestPhone}`}>
                        <Phone className="h-4 w-4" aria-hidden />{item.guestPhone}
                      </a>
                    ) : <p className="mt-2 text-xs text-slate">Телефон не указан</p>}
                  </div>

                  {item.guestMessage ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate">Комментарий гостя</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.guestMessage}</p>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-border-subtle p-3 text-sm">
                    <p className="font-semibold text-foreground">
                      Ориентир: {formatMoney(estimatedTotal, item.priceCurrencySnapshot)} за {nights} {nights === 1 ? "ночь" : "ночей"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate">
                      Расчёт по цене на момент заявки. Итоговые условия нужно подтвердить гостю отдельно.
                    </p>
                  </div>

                  {(item.status === "awaiting_confirmation" || item.status === "in_review" || item.status === "confirmed") ? (
                    <div>
                      {item.statusNote ? <p className="mb-3 rounded-xl bg-surface-muted p-3 text-sm text-slate">Последний комментарий: {item.statusNote}</p> : null}
                      <FormField id={`apartment-inquiry-note-${item.id}`} label="Новый внутренний комментарий" optional hint="Не добавляйте платёжные данные или пароли.">
                        <Textarea
                          id={`apartment-inquiry-note-${item.id}`}
                          rows={2}
                          maxLength={1000}
                          value={notes[item.id] ?? ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                          disabled={Boolean(busyId)}
                          placeholder="Например, ждём подтверждение времени заселения"
                        />
                      </FormField>
                    </div>
                  ) : item.statusNote ? (
                    <p className="rounded-xl bg-surface-muted p-3 text-sm text-slate">Последний комментарий: {item.statusNote}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {item.status === "awaiting_confirmation" ? (
                      <>
                        <Button size="sm" onClick={() => void transition(item, "in_review")} loading={itemBusy} loadingLabel="Берём в работу…" disabled={Boolean(busyId && !itemBusy)}>
                          <Clock3 className="h-4 w-4" aria-hidden />Взять в работу
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void transition(item, "cancelled")} disabled={Boolean(busyId)}>
                          <XCircle className="h-4 w-4" aria-hidden />Отменить
                        </Button>
                      </>
                    ) : null}
                    {item.status === "in_review" ? (
                      <>
                        <Button size="sm" onClick={() => void transition(item, "confirmed")} loading={itemBusy} loadingLabel="Подтверждаем…" disabled={Boolean(busyId && !itemBusy)}>
                          <CheckCircle2 className="h-4 w-4" aria-hidden />Подтвердить даты
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void transition(item, "rejected")} disabled={Boolean(busyId)}>
                          <XCircle className="h-4 w-4" aria-hidden />Отклонить
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void transition(item, "cancelled")} disabled={Boolean(busyId)}>
                          Отменить
                        </Button>
                      </>
                    ) : null}
                    {item.status === "confirmed" ? (
                      <Button size="sm" variant="outline" onClick={() => void transition(item, "cancelled")} loading={itemBusy} loadingLabel="Отменяем…" disabled={Boolean(busyId && !itemBusy)}>
                        <XCircle className="h-4 w-4" aria-hidden />Отменить подтверждение
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {!loading && !visibleItems.length && !error ? (
        <EmptyState
          className="mt-5"
          icon={Inbox}
          variant={role === "admin" ? "admin" : "cabinet"}
          title="В этом разделе заявок нет"
          description={filter === "active" ? "Новые запросы гостей появятся здесь." : "Выберите другой фильтр, чтобы увидеть историю."}
        />
      ) : null}
    </section>
  );
}
