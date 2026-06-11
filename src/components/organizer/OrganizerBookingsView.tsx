"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { resolveBookingAmounts } from "@/lib/booking-payment-display";
import { BOOKING_STATUSES_ACTIVE, BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { useAuth } from "@/context/AuthContext";
import {
  getOrganizerBookingsForCabinet,
} from "@/lib/organizer-bookings";
import { formatBookingTourDates } from "@/lib/booking-display";
import { BOOKINGS_UPDATED_EVENT, type Booking, type BookingStatusActive } from "@/types/tourist";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";

type StatusFilter = "all" | BookingStatusActive;
type SortOption = "newest" | "oldest" | "tourDate" | "amountDesc" | "amountAsc";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Сначала новые" },
  { id: "oldest", label: "Сначала старые" },
  { id: "tourDate", label: "По дате тура" },
  { id: "amountDesc", label: "Сумма: по убыванию" },
  { id: "amountAsc", label: "Сумма: по возрастанию" },
];

export default function OrganizerBookingsView() {
  const { user } = useAuth();
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
    if (!user) return;

    function refresh() {
      setBookings(getOrganizerBookingsForCabinet(user!.id));
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [user]);

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
    <div className={cn(cabinetCardClass, "overflow-hidden")}>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">Заявки</h1>
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
            <NativeSelect
              id="booking-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">Все статусы</option>
              {BOOKING_STATUSES_ACTIVE.map((status) => (
                <option key={status} value={status}>
                  {BOOKING_STATUS_LABELS[status]}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div>
            <label htmlFor="booking-sort" className="sr-only">
              Сортировка
            </label>
            <NativeSelect
              id="booking-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className={cabinetTableWrapClass}>
            <Table className="min-w-[920px] text-left">
              <TableHeader className={cabinetTableHeaderClass}>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Тур</TableHead>
                  <TableHead>Турист</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Заявка</TableHead>
                  <TableHead>Тур</TableHead>
                  <TableHead>Гости</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const amounts = resolveBookingAmounts(booking);
                  return (
                  <TableRow key={booking.id}>
                    <TableCell>
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
                        <span className="line-clamp-2 font-medium text-charcoal transition-colors hover:text-sky">
                          {booking.tourTitle}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-charcoal">{booking.contactName}</TableCell>
                    <TableCell className="text-slate">
                      <div>{booking.contactEmail}</div>
                      <div className="mt-0.5">{booking.contactPhone}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate">
                      {formatBookingCreatedAt(booking.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate">
                      {formatBookingTourDates(booking, "Даты по согласованию")}
                    </TableCell>
                    <TableCell className="text-charcoal">{booking.guests}</TableCell>
                    <TableCell>
                      <FormattedPrice priceUsd={booking.totalPriceUsd} className="font-medium" />
                    </TableCell>
                    <TableCell>
                      <BookingPaymentStatusBadge booking={booking} />
                      {amounts.due > 0 ? (
                        <p className="mt-1 text-xs text-slate">
                          К оплате:{" "}
                          <FormattedPrice
                            priceUsd={amounts.due}
                            className="font-medium text-charcoal"
                          />
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="Заявок не найдено"
            description="Измените фильтры или дождитесь новых бронирований с сайта."
          />
        )}
      </div>
    </div>
  );
}
