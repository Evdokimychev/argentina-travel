"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { BOOKING_STATUSES_ACTIVE, BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import FormattedPrice from "@/components/FormattedPrice";
import type { AdminBookingSummary, AdminBookingsStats } from "@/lib/admin/bookings-server";
import { normalizeBookingPaymentStatus } from "@/lib/booking-params";
import type { Booking, BookingStatusActive } from "@/types/tourist";
import type { BookingPaymentStatus } from "@/types/booking-params";

type BookingsResponse = {
  bookings?: AdminBookingSummary[];
  stats?: AdminBookingsStats;
};

type StatusFilter = "all" | BookingStatusActive;

export default function BookingsView() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const url =
    statusFilter === "all"
      ? "/api/admin/bookings"
      : `/api/admin/bookings?status=${statusFilter}`;
  const { data, loading, error, refresh } = useAdminApi<BookingsResponse>(url);
  const bookings = data?.bookings ?? [];
  const stats = data?.stats;
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter(
      (b) =>
        b.tourTitle.toLowerCase().includes(query) ||
        b.contactName.toLowerCase().includes(query) ||
        b.contactEmail.toLowerCase().includes(query) ||
        b.contactPhone.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query)
    );
  }, [bookings, search]);

  async function openDetail(bookingId: string) {
    setDetailId(bookingId);
    setDetail(null);
    const res = await fetch(`/api/admin/bookings/${bookingId}`);
    const json = (await res.json()) as { booking?: Booking; error?: string };
    if (res.ok && json.booking) setDetail(json.booking);
  }

  async function updateStatus(bookingId: string, status: BookingStatusActive) {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Не удалось обновить статус");
      }
      await refresh();
    } catch (updateError) {
      alert(updateError instanceof Error ? updateError.message : "Ошибка");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    const bookingIdFromQuery = searchParams.get("bookingId");
    if (!bookingIdFromQuery || bookingIdFromQuery === detailId) return;
    void openDetail(bookingIdFromQuery);
  }, [searchParams, detailId]);

  return (
    <CapabilityGate capability="operations.bookings">
      <AdminPageShell>
        <AdminPageHeader
          title="Бронирования"
          subtitle="Все заявки на туры платформы"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/api/admin/bookings/export";
                }}
              >
                CSV
              </Button>
              <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
                Обновить
              </Button>
            </div>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {stats ? (
          <section className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-charcoal">
              Всего: {stats.total}
            </span>
            {BOOKING_STATUSES_ACTIVE.map((status) =>
              stats.byStatus[status] ? (
                <span
                  key={status}
                  className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky"
                >
                  {BOOKING_STATUS_LABELS[status]}: {stats.byStatus[status]}
                </span>
              ) : null
            )}
          </section>
        ) : null}

        <section className={`${cabinetCardClass} space-y-4 p-4 sm:p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по туру, имени, email, телефону…"
              className="sm:max-w-md"
            />
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="sm:w-48"
            >
              <option value="all">Все статусы</option>
              {BOOKING_STATUSES_ACTIVE.map((status) => (
                <option key={status} value={status}>
                  {BOOKING_STATUS_LABELS[status]}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className={cabinetTableWrapClass}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className={cabinetTableHeaderClass}>
                <tr>
                  <th className="px-4 py-3 font-medium text-slate">Заявка</th>
                  <th className="px-4 py-3 font-medium text-slate">Турист</th>
                  <th className="px-4 py-3 font-medium text-slate">Статус</th>
                  <th className="px-4 py-3 font-medium text-slate">Оплата</th>
                  <th className="px-4 py-3 font-medium text-slate">Сумма</th>
                  <th className="px-4 py-3 font-medium text-slate">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate">
                      {loading ? "Загрузка…" : "Заявок не найдено"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <tr key={booking.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-charcoal">{booking.tourTitle}</p>
                        <p className="mt-1 text-xs text-slate">
                          {formatAdminWhen(booking.createdAt)} · {booking.guests} гост.
                        </p>
                        <Link
                          href={`/tours/${booking.tourSlug}`}
                          className="text-xs text-sky hover:underline"
                        >
                          {booking.tourSlug}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate">
                        <p className="font-medium text-charcoal">{booking.contactName}</p>
                        <p className="text-xs">{booking.contactEmail}</p>
                        {booking.contactPhone ? (
                          <p className="text-xs">{booking.contactPhone}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3">
                        <BookingPaymentStatusBadge
                          status={normalizeBookingPaymentStatus(
                            booking.paymentStatus as BookingPaymentStatus | "unpaid" | undefined
                          )}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <FormattedPrice priceUsd={booking.totalPriceUsd} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <NativeSelect
                            value={booking.status}
                            disabled={updatingId === booking.id}
                            onChange={(e) =>
                              void updateStatus(booking.id, e.target.value as BookingStatusActive)
                            }
                            className="min-w-[140px] text-xs"
                          >
                            {BOOKING_STATUSES_ACTIVE.map((status) => (
                              <option key={status} value={status}>
                                {BOOKING_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </NativeSelect>
                          <Button size="sm" variant="ghost" onClick={() => void openDetail(booking.id)}>
                            Подробнее
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {detailId && detail ? (
          <section className={`${cabinetCardClass} space-y-4 p-5 text-sm`}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-charcoal">{detail.tourTitle}</h2>
              <Button size="sm" variant="ghost" onClick={() => setDetailId(null)}>
                Закрыть
              </Button>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate">Заявка</dt>
                <dd className="font-medium text-charcoal">{detail.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate">Статус</dt>
                <dd>{BOOKING_STATUS_LABELS[detail.status as BookingStatusActive] ?? detail.status}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate">Турист</dt>
                <dd>
                  {detail.contactName}
                  <br />
                  {detail.contactEmail}
                  {detail.contactPhone ? ` · ${detail.contactPhone}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate">Даты / гости</dt>
                <dd>
                  {detail.startDate ?? "—"}
                  {detail.endDate ? ` → ${detail.endDate}` : ""}
                  <br />
                  {detail.guests} гост.
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate">Сумма</dt>
                <dd>
                  <FormattedPrice priceUsd={detail.totalPriceUsd} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate">Создана</dt>
                <dd>{formatAdminWhen(detail.createdAt)}</dd>
              </div>
            </dl>
            {detail.touristComment ? (
              <div>
                <p className="text-xs text-slate">Комментарий туриста</p>
                <p className="mt-1 text-charcoal">{detail.touristComment}</p>
              </div>
            ) : null}
            {detail.statusHistory.length ? (
              <div>
                <p className="text-xs font-medium text-slate">История статусов</p>
                <ul className="mt-2 space-y-1 text-xs text-charcoal">
                  {detail.statusHistory.map((entry) => (
                    <li key={entry.id}>
                      {formatAdminWhen(entry.changedAt)} —{" "}
                      {entry.from ? BOOKING_STATUS_LABELS[entry.from as BookingStatusActive] ?? entry.from : "—"}{" "}
                      → {BOOKING_STATUS_LABELS[entry.to as BookingStatusActive] ?? entry.to}
                      {entry.note ? ` (${entry.note})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
