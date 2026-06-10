"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { BOOKING_STATUSES_ACTIVE, BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import {
  getOrganizerBookingsForCabinet,
} from "@/lib/organizer-bookings";
import { BOOKINGS_UPDATED_EVENT, type Booking, type BookingStatusActive } from "@/types/tourist";
import { formatDateShort } from "@/lib/utils";
import FormattedPrice from "@/components/FormattedPrice";

type StatusFilter = "all" | BookingStatusActive;
type SortOption = "newest" | "oldest" | "tourDate" | "amountDesc" | "amountAsc";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Сначала новые" },
  { id: "oldest", label: "Сначала старые" },
  { id: "tourDate", label: "По дате тура" },
  { id: "amountDesc", label: "Сумма: по убыванию" },
  { id: "amountAsc", label: "Сумма: по возрастанию" },
];

function formatTourDates(booking: Booking): string {
  if (!booking.startDate) return "Даты по согласованию";
  const start = formatDateShort(booking.startDate);
  return booking.endDate ? `${start} — ${formatDateShort(booking.endDate)}` : start;
}

export default function OrganizerBookingsView() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as StatusFilter) || "all";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    BOOKING_STATUSES_ACTIVE.includes(initialStatus as BookingStatusActive)
      ? (initialStatus as StatusFilter)
      : "all"
  );
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    function refresh() {
      setBookings(getOrganizerBookingsForCabinet());
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) return false;
      if (!query) return true;

      return (
        booking.tourTitle.toLowerCase().includes(query) ||
        booking.contactName.toLowerCase().includes(query) ||
        booking.contactEmail.toLowerCase().includes(query) ||
        booking.contactPhone.toLowerCase().includes(query)
      );
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);
        case "tourDate":
          return (a.startDate ?? "").localeCompare(b.startDate ?? "");
        case "amountDesc":
          return b.totalPriceUsd - a.totalPriceUsd;
        case "amountAsc":
          return a.totalPriceUsd - b.totalPriceUsd;
        case "newest":
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

    return list;
  }, [bookings, search, sort, statusFilter]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">Заявки</h1>
          <p className="mt-1 text-sm text-slate">
            Входящие бронирования и запросы туристов по вашим турам
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="relative lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск: тур, имя, email, телефон"
              className="pl-10"
            />
          </div>

          <div>
            <label htmlFor="booking-status-filter" className="sr-only">
              Статус заявки
            </label>
            <select
              id="booking-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="flex h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">Все статусы</option>
              {BOOKING_STATUSES_ACTIVE.map((status) => (
                <option key={status} value={status}>
                  {BOOKING_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="booking-sort" className="sr-only">
              Сортировка
            </label>
            <select
              id="booking-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="flex h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-pampas/60 text-slate">
                <tr>
                  <th className="px-4 py-3 font-medium">Тур</th>
                  <th className="px-4 py-3 font-medium">Турист</th>
                  <th className="px-4 py-3 font-medium">Контакты</th>
                  <th className="px-4 py-3 font-medium">Заявка</th>
                  <th className="px-4 py-3 font-medium">Тур</th>
                  <th className="px-4 py-3 font-medium">Гости</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="transition-colors hover:bg-gray-50/80">
                    <td className="px-4 py-4">
                      <Link
                        href={`/organizer/bookings/${booking.id}`}
                        className="flex min-w-[220px] items-center gap-3"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={booking.tourImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <span className="line-clamp-2 font-medium text-charcoal hover:text-brand">
                          {booking.tourTitle}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-charcoal">{booking.contactName}</td>
                    <td className="px-4 py-4 text-slate">
                      <div>{booking.contactEmail}</div>
                      <div className="mt-0.5">{booking.contactPhone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate">
                      {formatBookingCreatedAt(booking.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate">
                      {formatTourDates(booking)}
                    </td>
                    <td className="px-4 py-4 text-charcoal">{booking.guests}</td>
                    <td className="px-4 py-4">
                      <FormattedPrice priceUsd={booking.totalPriceUsd} className="font-medium" />
                    </td>
                    <td className="px-4 py-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="font-medium text-charcoal">Заявок не найдено</p>
            <p className="mt-2 text-sm text-slate">
              Измените фильтры или дождитесь новых бронирований с сайта.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
