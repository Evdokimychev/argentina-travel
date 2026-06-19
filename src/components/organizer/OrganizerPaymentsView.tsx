"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import FormattedPrice from "@/components/FormattedPrice";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerBookingsForCabinet } from "@/lib/organizer-bookings";
import { resolveBookingAmounts } from "@/lib/booking-payment-display";
import { getOrganizerAnalytics } from "@/lib/organizer-analytics";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import {
  cabinetCardClass,
  cabinetHeroClass,
  cabinetTableHeaderClass,
  cabinetTableWrapClass,
} from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

export default function OrganizerPaymentsView() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [revenueUsd, setRevenueUsd] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      const list = getOrganizerBookingsForCabinet(user!.id).filter(
        (booking) => booking.status !== "cancelled"
      );
      setBookings(list);
      const analytics = getOrganizerAnalytics(user!.id);
      setRevenueUsd(analytics.revenueUsd);
      setPendingCount(analytics.pendingPaymentsCount);
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [user]);

  const rows = useMemo(
    () =>
      [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bookings]
  );

  return (
    <div className="space-y-6">
      <header className={cabinetHeroClass}>
        <h1 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Платежи</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate">
          Сводка по заявкам и статусам оплаты. Реальные выплаты на счёт организатора подключатся
          отдельно — здесь только прозрачная картина по бронированиям.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cn(cabinetCardClass, "p-5")}>
          <p className="text-sm text-slate">Подтверждённая выручка</p>
          <p className="mt-2 font-heading text-3xl font-bold text-charcoal">
            <FormattedPrice priceUsd={revenueUsd} />
          </p>
        </div>
        <div className={cn(cabinetCardClass, "p-5")}>
          <p className="text-sm text-slate">Ожидают оплаты</p>
          <p className="mt-2 font-heading text-3xl font-bold text-charcoal">{pendingCount}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Платежей пока нет"
          description="Когда появятся заявки с суммами и статусами оплаты, они отобразятся в таблице."
        />
      ) : (
        <div className={cabinetTableWrapClass}>
          <Table>
            <TableHeader>
              <TableRow className={cabinetTableHeaderClass}>
                <TableHead>Заявка</TableHead>
                <TableHead>Тур</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="text-right">Оплачено</TableHead>
                <TableHead className="text-right">К оплате</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((booking) => {
                const amounts = resolveBookingAmounts(booking);
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      <Link
                        href={`/organizer/bookings/${booking.id}`}
                        className="font-medium text-charcoal hover:text-sky"
                      >
                        #{booking.id.slice(-6)}
                      </Link>
                      <p className="text-xs text-slate">{formatBookingCreatedAt(booking.createdAt)}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-charcoal">
                      {booking.tourTitle}
                    </TableCell>
                    <TableCell>
                      <BookingPaymentStatusBadge booking={booking} />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <FormattedPrice priceUsd={amounts.total} />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <FormattedPrice priceUsd={amounts.paid} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      <FormattedPrice priceUsd={amounts.due} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
