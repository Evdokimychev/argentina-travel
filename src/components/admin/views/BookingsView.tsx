"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { BOOKING_STATUSES_ACTIVE, BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import FormattedPrice from "@/components/FormattedPrice";
import type { AdminBookingSummary, AdminBookingsStats } from "@/lib/admin/bookings-server";
import type { BookingStatusActive } from "@/types/tourist";

type BookingsResponse = {
  bookings?: AdminBookingSummary[];
  stats?: AdminBookingsStats;
};

type StatusFilter = "all" | BookingStatusActive;

export default function BookingsView() {
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

  return (
    <CapabilityGate capability="operations.bookings">
      <AdminPageShell>
        <AdminPageHeader
          title="Бронирования"
          subtitle="Все заявки на туры платформы"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
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
                  <th className="px-4 py-3 font-medium text-slate">Сумма</th>
                  <th className="px-4 py-3 font-medium text-slate">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate">
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
                        <FormattedPrice priceUsd={booking.totalPriceUsd} />
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
