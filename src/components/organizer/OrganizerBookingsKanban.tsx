"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Inbox,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import OrganizerBookingCard from "@/components/organizer/OrganizerBookingCard";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { cn } from "@/lib/cn";
import { cabinetLinkClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import type { Booking, BookingStatusActive } from "@/types/tourist";

type KanbanColumnId = "attention" | "confirmed" | "completed" | "cancelled";

interface KanbanColumnDef {
  id: KanbanColumnId;
  label: string;
  statuses: BookingStatusActive[];
  icon: LucideIcon;
  tone: string;
  headerTone: string;
  emptyTitle: string;
  emptyDescription: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    id: "attention",
    label: "Новые",
    statuses: ["new", "pending"],
    icon: Inbox,
    tone: "border-violet-100 bg-violet-50/30",
    headerTone: "text-violet-800 bg-violet-50",
    emptyTitle: "Нет новых заявок",
    emptyDescription: "Свежие бронирования и заявки в обработке появятся здесь.",
  },
  {
    id: "confirmed",
    label: BOOKING_STATUS_LABELS.confirmed,
    statuses: ["confirmed"],
    icon: CheckCircle2,
    tone: "border-emerald-100 bg-emerald-50/30",
    headerTone: "text-emerald-800 bg-emerald-50",
    emptyTitle: "Нет подтверждённых",
    emptyDescription: "Подтверждённые заявки с датами и оплатой будут здесь.",
  },
  {
    id: "completed",
    label: BOOKING_STATUS_LABELS.completed,
    statuses: ["completed"],
    icon: CalendarCheck,
    tone: "border-sky/20 bg-sky/5",
    headerTone: "text-sky bg-sky/10",
    emptyTitle: "Нет завершённых",
    emptyDescription: "После поездки заявки перемещаются в этот столбец.",
  },
  {
    id: "cancelled",
    label: BOOKING_STATUS_LABELS.cancelled,
    statuses: ["cancelled"],
    icon: XCircle,
    tone: "border-gray-200 bg-gray-50/60",
    headerTone: "text-slate bg-gray-100",
    emptyTitle: "Нет отменённых",
    emptyDescription: "Отменённые заявки сохраняются для истории.",
  },
];

interface OrganizerBookingsKanbanProps {
  bookings: Booking[];
  /** Ограничение карточек в столбце (для обзора на дашборде) */
  limitPerColumn?: number;
  showHeader?: boolean;
  className?: string;
}

export default function OrganizerBookingsKanban({
  bookings,
  limitPerColumn,
  showHeader = true,
  className,
}: OrganizerBookingsKanbanProps) {
  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map((column) => {
      const items = bookings
        .filter((booking) => column.statuses.includes(booking.status as BookingStatusActive))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const total = items.length;
      const visible = limitPerColumn != null ? items.slice(0, limitPerColumn) : items;
      const hidden = limitPerColumn != null ? Math.max(0, total - limitPerColumn) : 0;

      return { ...column, items: visible, total, hidden };
    });
  }, [bookings, limitPerColumn]);

  const hasAnyBookings = bookings.length > 0;

  if (!hasAnyBookings) {
    return (
      <section className={cn(cabinetPanelClass, className)}>
        {showHeader ? (
          <KanbanHeader />
        ) : null}
        <EmptyState
          icon={ClipboardList}
          title="Заявок пока нет"
          description="Когда туристы забронируют ваши туры, карточки появятся в столбцах по статусу."
          action={{ label: "Мои туры", href: "/organizer/tours" }}
          secondaryAction={{ label: "Сообщения", href: "/organizer/messages" }}
        />
      </section>
    );
  }

  return (
    <section className={cn(cabinetPanelClass, className)}>
      {showHeader ? <KanbanHeader /> : null}

      <div
        className={cn(
          "mt-4 gap-4",
          "columns-1 space-y-4",
          "sm:columns-2 sm:space-y-0",
          "xl:columns-4"
        )}
      >
        {columns.map((column) => {
          const Icon = column.icon;
          return (
            <div
              key={column.id}
              className={cn(
                "mb-4 break-inside-avoid rounded-2xl border p-3 sm:p-4",
                column.tone
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold",
                    column.headerTone
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  {column.label}
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-charcoal ring-1 ring-gray-100">
                  {column.total}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {column.items.length > 0 ? (
                  column.items.map((booking) => (
                    <OrganizerBookingCard
                      key={booking.id}
                      booking={booking}
                      compact={Boolean(limitPerColumn)}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200/80 bg-white/60 px-3 py-6 text-center">
                    <p className="text-xs font-medium text-charcoal">{column.emptyTitle}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate">
                      {column.emptyDescription}
                    </p>
                  </div>
                )}
                {column.hidden > 0 ? (
                  <Link
                    href={`/organizer/bookings?status=${column.statuses[0]}`}
                    className={cn(cabinetLinkClass, "block text-center text-xs")}
                  >
                    Ещё {column.hidden} →
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function KanbanHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-heading text-lg font-bold text-charcoal">Заявки по статусу</h2>
        <p className="mt-1 text-sm text-slate">
          Канбан: новые, подтверждённые, завершённые и отменённые
        </p>
      </div>
      <Link href="/organizer/bookings" className={cabinetLinkClass}>
        Все заявки →
      </Link>
    </div>
  );
}
