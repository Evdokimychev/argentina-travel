"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarCheck2, RefreshCw } from "lucide-react";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import type { MobilityInventoryItem, MobilityOperationsRequest, MobilityRequestStatus, MobilityVertical } from "@/types/mobility";

type Props = {
  mode: "organizer" | "admin";
  vertical: MobilityVertical;
  vehicles: MobilityInventoryItem[];
};

const STATUS_LABELS: Record<MobilityRequestStatus, string> = {
  submitted: "Новая",
  in_review: "Проверяем детали",
  confirmed: "Подтверждена",
  rejected: "Отклонена",
  cancelled: "Отменена",
  completed: "Завершена",
  no_show: "Клиент не приехал",
};

const STATUS_STYLES: Record<MobilityRequestStatus, string> = {
  submitted: "bg-sky-50 text-sky-800",
  in_review: "bg-amber-50 text-amber-800",
  confirmed: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  cancelled: "bg-slate-100 text-slate-600",
  completed: "bg-emerald-50 text-emerald-800",
  no_show: "bg-slate-100 text-slate-600",
};

function formatMoney(value: number | null, currency: string): string {
  if (value === null) return "Уточняется";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(value / 100);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Дата уточняется" : new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function pickupSummary(details: Record<string, unknown>): string | null {
  const values = [details.pickup, details.pickupAt, details.flightNumber, details.comment]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return values.length > 0 ? values.join(" · ") : null;
}

export default function MobilityRequestInbox({ mode, vertical, vehicles }: Props) {
  const [requests, setRequests] = useState<MobilityOperationsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadSequence = useRef(0);
  const loadAbortRef = useRef<AbortController | null>(null);
  const mutationLockRef = useRef(false);
  const endpoint = mode === "admin" ? "/api/admin/mobility/requests" : "/api/organizer/mobility/requests";
  const publishedVehicles = vehicles.filter((vehicle) => vehicle.status === "published" && vehicle.verification_status === "verified");

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}?vertical=${vertical}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json().catch(() => ({})) as { requests?: MobilityOperationsRequest[] };
      if (!response.ok || !Array.isArray(payload.requests)) throw new Error("requests_unavailable");
      if (sequence === loadSequence.current) setRequests(payload.requests);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      if (sequence === loadSequence.current) {
        setRequests([]);
        setError("Не удалось загрузить заявки. Старые данные не показываются — обновите список.");
      }
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [endpoint, vertical]);

  useEffect(() => {
    void load();
    return () => loadAbortRef.current?.abort();
  }, [load]);

  async function transition(
    item: MobilityOperationsRequest,
    nextStatus: MobilityRequestStatus,
    allocation?: { vehicleId: string; startsAt: string; endsAt: string },
  ) {
    if (mutationLockRef.current) return;
    mutationLockRef.current = true;
    setBusyId(item.id);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: item.id,
          vertical,
          expectedVersion: item.rowVersion,
          nextStatus,
          operationId: crypto.randomUUID(),
          ...allocation,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { code?: string };
      if (!response.ok) {
        setError(payload.code === "VERSION_CONFLICT"
          ? "Заявка уже изменилась в другой вкладке. Обновите список."
          : "Не удалось изменить заявку. Проверьте данные, доступность транспорта и повторите действие.");
        return;
      }
      await load();
    } catch {
      setError("Связь прервалась. Обновите список перед повторным действием.");
    } finally {
      mutationLockRef.current = false;
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby="mobility-requests-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="mobility-requests-title" className="text-lg font-semibold text-foreground">Заявки клиентов</h2>
          <p className="mt-1 text-sm text-muted">Проверяйте детали, назначайте свободный транспорт и только затем подтверждайте поездку.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading || Boolean(busyId)}>
          <RefreshCw className="h-4 w-4" aria-hidden /> Обновить
        </Button>
      </div>

      {error ? <div className="mt-3"><InlineFeedback variant="error" title="Заявки недоступны" description={error} /></div> : null}
      {loading ? <div className="mt-3"><InlineFeedback variant="loading" title="Загружаем заявки" /></div> : null}
      {!loading && !error && requests.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={CalendarCheck2}
            variant={mode === "admin" ? "admin" : "cabinet"}
            title="Новых заявок пока нет"
            description="Когда клиент отправит запрос, он появится здесь. Бронирование не подтверждается автоматически."
          />
        </div>
      ) : null}

      {!loading && !error && requests.length > 0 ? (
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {requests.map((item) => {
            const busy = busyId === item.id;
            const details = pickupSummary(item.pickupDetails);
            return (
              <article key={item.id} className={cn(cabinetCardClass, "p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">{item.vertical === "rental" ? "Аренда автомобиля" : "Трансфер"}</p>
                    <h3 className="mt-1 font-semibold text-foreground">{item.productTitle || "Предложение"}</h3>
                    <p className="mt-1 text-sm text-muted">Получена {formatDateTime(item.createdAt)}</p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLES[item.status])}>{STATUS_LABELS[item.status]}</span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted">Клиент</dt><dd className="mt-0.5 font-medium">{item.contactName}</dd></div>
                  <div><dt className="text-xs text-muted">Ориентировочная стоимость</dt><dd className="mt-0.5 font-medium">{formatMoney(item.quotedPriceMinor, item.displayCurrency)}</dd></div>
                  <div><dt className="text-xs text-muted">Email</dt><dd className="mt-0.5 break-all"><a className="text-sky hover:underline" href={`mailto:${item.contactEmail}`}>{item.contactEmail}</a></dd></div>
                  <div><dt className="text-xs text-muted">Телефон</dt><dd className="mt-0.5">{item.contactPhone || "Не указан"}</dd></div>
                </dl>
                {details ? <p className="mt-3 rounded-xl bg-surface-muted p-3 text-sm text-foreground">Детали: {details}</p> : null}
                {item.customerNote ? <p className="mt-3 text-sm text-muted">Комментарий клиента: {item.customerNote}</p> : null}
                {item.allocation ? (
                  <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    Транспорт назначен: {formatDateTime(item.allocation.startsAt)} — {formatDateTime(item.allocation.endsAt)}
                  </p>
                ) : null}

                {item.status === "submitted" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" loading={busy} onClick={() => void transition(item, "in_review")}>Начать проверку</Button>
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => {
                      if (window.confirm("Отклонить эту заявку? Клиенту потребуется оформить новый запрос.")) void transition(item, "rejected");
                    }}>Отклонить</Button>
                  </div>
                ) : null}

                {item.status === "in_review" ? (
                  <form className="mt-4 space-y-3 rounded-2xl bg-surface-muted p-4" onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const vehicleId = String(data.get("vehicleId") ?? "");
                    const starts = String(data.get("startsAt") ?? "");
                    const ends = String(data.get("endsAt") ?? "");
                    const startsDate = new Date(starts);
                    const endsDate = new Date(ends);
                    if (!vehicleId || Number.isNaN(startsDate.getTime()) || Number.isNaN(endsDate.getTime()) || endsDate <= startsDate) {
                      setError("Для подтверждения выберите транспорт и корректный период поездки.");
                      return;
                    }
                    if (!window.confirm("Подтвердить заявку и занять выбранный транспорт на указанный период?")) return;
                    void transition(item, "confirmed", { vehicleId, startsAt: startsDate.toISOString(), endsAt: endsDate.toISOString() });
                  }}>
                    <FormField id={`mobility-request-vehicle-${item.id}`} label="Свободный транспорт" required>
                      <NativeSelect name="vehicleId" required disabled={busy || publishedVehicles.length === 0}>
                        <option value="">Выберите транспорт</option>
                        {publishedVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.public_name || "Транспорт"}</option>)}
                      </NativeSelect>
                    </FormField>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField id={`mobility-request-start-${item.id}`} label="Начало" required><Input name="startsAt" type="datetime-local" required disabled={busy} /></FormField>
                      <FormField id={`mobility-request-end-${item.id}`} label="Завершение" required><Input name="endsAt" type="datetime-local" required disabled={busy} /></FormField>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm" loading={busy} disabled={publishedVehicles.length === 0}>Подтвердить и занять транспорт</Button>
                      <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => {
                        if (window.confirm("Отклонить заявку после проверки?")) void transition(item, "rejected");
                      }}>Отклонить</Button>
                    </div>
                    {publishedVehicles.length === 0 ? <p className="text-xs text-amber-800">Нет проверенного опубликованного транспорта. Сначала завершите проверку автомобиля.</p> : null}
                  </form>
                ) : null}

                {item.status === "confirmed" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy} onClick={() => {
                      if (window.confirm("Отметить поездку завершённой?")) void transition(item, "completed");
                    }}>Завершена</Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => {
                      if (window.confirm("Отметить, что клиент не приехал?")) void transition(item, "no_show");
                    }}>Клиент не приехал</Button>
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => {
                      if (window.confirm("Отменить подтверждённую заявку и освободить транспорт?")) void transition(item, "cancelled");
                    }}>Отменить и освободить транспорт</Button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
