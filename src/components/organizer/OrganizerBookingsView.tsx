"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ClipboardList, ListOrdered, LayoutGrid, Table2 } from "lucide-react";
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
import { apiFetchOrganizerBookings, isRemoteBookingsMode } from "@/lib/bookings-api";
import { formatBookingTourDates } from "@/lib/booking-display";
import { BOOKINGS_UPDATED_EVENT, type Booking, type BookingStatusActive } from "@/types/tourist";
import FormattedPrice from "@/components/FormattedPrice";
import BookingLedgerAmount from "@/components/booking/BookingLedgerAmount";
import { cn } from "@/lib/cn";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import OrganizerWaitlistView from "@/components/organizer/OrganizerWaitlistView";
import OrganizerBookingsKanban from "@/components/organizer/OrganizerBookingsKanban";
import { getOrganizerCabinetWaitlistStats } from "@/lib/organizer-waitlist";
import { WAITLIST_UPDATED_EVENT } from "@/types/waitlist";
import { OrganizerCreateExternalBookingButton } from "@/components/organizer/OrganizerCreateExternalBookingDialog";
import { BOOKING_SOURCE_LABELS } from "@/types/trip-operations";
import {
  attributionSourceKey,
  BOOKING_ATTRIBUTION_DIRECT_KEY,
  formatAttributionSourceLabel,
} from "@/types/booking-attribution";
import { computeTripProgress } from "@/lib/trip-operations";

type InboxTab = "bookings" | "waitlist";
type ViewMode = "kanban" | "table";

type StatusFilter = "all" | BookingStatusActive;
type SourceFilter = "all" | string;
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
  const initialTab = searchParams.get("tab") === "waitlist" ? "waitlist" : "bookings";

  const [inboxTab, setInboxTab] = useState<InboxTab>(initialTab);
  const [waitlistActiveCount, setWaitlistActiveCount] = useState(0);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    BOOKING_STATUSES_ACTIVE.includes(initialStatus as BookingStatusActive)
      ? (initialStatus as StatusFilter)
      : "all"
  );
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  useEffect(() => {
    if (!user) return;

    function refresh() {
      if (isRemoteBookingsMode()) {
        void apiFetchOrganizerBookings()
          .then(setBookings)
          .catch(() => setBookings([]));
        return;
      }
      setBookings(getOrganizerBookingsForCabinet(user!.id));
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    function refreshWaitlistStats() {
      setWaitlistActiveCount(getOrganizerCabinetWaitlistStats(user!.id).activeCount);
    }
    refreshWaitlistStats();
    window.addEventListener(WAITLIST_UPDATED_EVENT, refreshWaitlistStats);
    return () => window.removeEventListener(WAITLIST_UPDATED_EVENT, refreshWaitlistStats);
  }, [user]);

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const booking of bookings) {
      const key = attributionSourceKey(booking.attribution);
      const label =
        key === BOOKING_ATTRIBUTION_DIRECT_KEY
          ? "Прямой заход"
          : formatAttributionSourceLabel(booking.attribution);
      const existing = counts.get(key);
      counts.set(key, { label, count: (existing?.count ?? 0) + 1 });
    }
    return Array.from(counts.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count);
  }, [bookings]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) return false;
      if (sourceFilter !== "all" && attributionSourceKey(booking.attribution) !== sourceFilter) {
        return false;
      }
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
  }, [bookings, search, sort, statusFilter, sourceFilter]);

  return (
    <div className={cn(cabinetCardClass, "overflow-hidden")}>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">Заявки</h1>
            <p className="mt-1 text-sm text-slate">
              Бронирования и лист ожидания по вашим турам и экскурсиям
            </p>
          </div>
          {inboxTab === "bookings" && !isRemoteBookingsMode() ? (
            <OrganizerCreateExternalBookingButton />
          ) : null}
        </div>

        <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setInboxTab("bookings")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              inboxTab === "bookings"
                ? "bg-white text-charcoal shadow-sm"
                : "text-slate hover:text-charcoal"
            )}
          >
            <ClipboardList className="h-4 w-4" aria-hidden />
            Бронирования
          </button>
          <button
            type="button"
            onClick={() => setInboxTab("waitlist")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              inboxTab === "waitlist"
                ? "bg-white text-charcoal shadow-sm"
                : "text-slate hover:text-charcoal"
            )}
          >
            <ListOrdered className="h-4 w-4" aria-hidden />
            Лист ожидания
            {waitlistActiveCount > 0 ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                {waitlistActiveCount}
              </span>
            ) : null}
          </button>
        </div>

        {inboxTab === "waitlist" ? (
          <OrganizerWaitlistView />
        ) : (
          <>
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

        {sourceCounts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSourceFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sourceFilter === "all"
                  ? "bg-violet-100 text-violet-900"
                  : "bg-gray-100 text-slate hover:text-charcoal"
              )}
            >
              Все источники · {bookings.length}
            </button>
            {sourceCounts.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => setSourceFilter(row.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  sourceFilter === row.key
                    ? "bg-violet-100 text-violet-900"
                    : "bg-gray-100 text-slate hover:text-charcoal"
                )}
              >
                {row.label} · {row.count}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-slate hover:text-charcoal"
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Канбан
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "table"
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-slate hover:text-charcoal"
              )}
            >
              <Table2 className="h-4 w-4" aria-hidden />
              Таблица
            </button>
          </div>
        </div>

        {viewMode === "kanban" ? (
          filtered.length > 0 || bookings.length === 0 ? (
            <OrganizerBookingsKanban bookings={filtered} showHeader={false} className="border-0 p-0 shadow-none" />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="Заявок не найдено"
              description="Измените фильтры или дождитесь новых бронирований с сайта."
            />
          )
        ) : filtered.length > 0 ? (
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
                  const tripProgress = computeTripProgress(booking.tripOperations);
                  const sourceLabel =
                    booking.bookingSource && booking.bookingSource !== "platform"
                      ? BOOKING_SOURCE_LABELS[booking.bookingSource]
                      : null;
                  const attributionLabel = formatAttributionSourceLabel(booking.attribution);
                  const showAttribution =
                    booking.attribution?.utmSource &&
                    (!sourceLabel || attributionLabel !== "Прямой заход");
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
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-medium text-charcoal transition-colors hover:text-sky">
                            {booking.tourTitle}
                          </span>
                          {sourceLabel ? (
                            <span className="mt-0.5 block text-xs text-violet-700">
                              {sourceLabel}
                              {booking.externalReference ? ` · ${booking.externalReference}` : ""}
                            </span>
                          ) : null}
                          {showAttribution ? (
                            <span className="mt-0.5 block text-xs text-emerald-700">
                              UTM: {attributionLabel}
                            </span>
                          ) : null}
                          {tripProgress.total > 0 ? (
                            <span className="mt-0.5 block text-xs text-slate">
                              Подготовка: {tripProgress.percent}%
                            </span>
                          ) : null}
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
                      <BookingLedgerAmount
                        booking={booking}
                        priceUsd={booking.totalPriceUsd}
                        compact
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell>
                      <BookingPaymentStatusBadge booking={booking} />
                      {amounts.due > 0 ? (
                        <p className="mt-1 text-xs text-slate">
                          К оплате:{" "}
                          <BookingLedgerAmount
                            booking={booking}
                            priceUsd={amounts.due}
                            compact
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
          </>
        )}
      </div>
    </div>
  );
}
