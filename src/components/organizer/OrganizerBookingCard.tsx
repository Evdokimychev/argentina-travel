"use client";

import { useRef, useState, type MouseEvent, type TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Archive, Check, ExternalLink, Loader2, Mail, MessageSquare } from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingLedgerAmount from "@/components/booking/BookingLedgerAmount";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ORGANIZER_BOOKING_TRANSITIONS,
  isActiveBookingStatus,
} from "@/data/booking-statuses";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import {
  canOrganizerSeeContactDetails,
  formatBookingDisplayNumber,
  formatBookingTourDates,
} from "@/lib/booking-display";
import { updateBookingStatusWithHistory } from "@/lib/bookings-store";
import { apiUpdateBookingStatus, isRemoteBookingsMode } from "@/lib/bookings-api";
import { buildOrganizerBookingMessageHref } from "@/lib/messages-store";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import type { Booking, BookingStatusActive } from "@/types/tourist";

interface OrganizerBookingCardProps {
  booking: Booking;
  compact?: boolean;
  className?: string;
}

function getConfirmTarget(status: BookingStatusActive): BookingStatusActive | null {
  const transitions = ORGANIZER_BOOKING_TRANSITIONS[status] ?? [];
  if (transitions.includes("confirmed")) return "confirmed";
  if (transitions.includes("pending")) return "pending";
  return null;
}

function getArchiveTarget(status: BookingStatusActive): BookingStatusActive | null {
  const transitions = ORGANIZER_BOOKING_TRANSITIONS[status] ?? [];
  if (transitions.includes("completed")) return "completed";
  if (transitions.includes("cancelled")) return "cancelled";
  return null;
}

export default function OrganizerBookingCard({
  booking,
  compact = false,
  className,
}: OrganizerBookingCardProps) {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<"confirm" | "archive" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStateRef = useRef<{
    startX: number;
    startY: number;
    initialOffset: number;
    dragging: boolean;
  } | null>(null);

  const currentStatus = isActiveBookingStatus(booking.status) ? booking.status : "pending";
  const confirmTarget = getConfirmTarget(currentStatus);
  const archiveTarget = getArchiveTarget(currentStatus);
  const showContacts = canOrganizerSeeContactDetails(booking.status);
  const displayNumber = formatBookingDisplayNumber(booking.id);
  const messageHref = buildOrganizerBookingMessageHref(booking.id);
  const tourHref = `/tours/${booking.tourSlug}`;
  const bookingHref = `/organizer/bookings/${booking.id}`;
  const swipeActionsWidth = (confirmTarget ? 88 : 0) + (archiveTarget ? 88 : 0);
  const canSwipeActions = !compact && swipeActionsWidth > 0;

  async function handleStatusUpdate(
    status: BookingStatusActive,
    source: "confirm" | "archive",
    event?: MouseEvent
  ) {
    event?.preventDefault();
    event?.stopPropagation();
    if (actionLoading) return;

    setActionLoading(source);
    setActionError(null);

    try {
      if (isRemoteBookingsMode()) {
        await apiUpdateBookingStatus({
          bookingId: booking.id,
          status,
          changedBy: "organizer",
        });
      } else {
        const result = updateBookingStatusWithHistory({
          bookingId: booking.id,
          status,
          changedBy: "organizer",
          actor: user,
        });
        if ("error" in result) {
          setActionError(result.error);
        }
      }
      setSwipeOffset(0);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось обновить статус");
    } finally {
      setActionLoading(null);
    }
  }

  function handleSwipeStart(event: TouchEvent<HTMLDivElement>) {
    if (!canSwipeActions) return;
    const touch = event.touches[0];
    swipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialOffset: swipeOffset,
      dragging: false,
    };
  }

  function handleSwipeMove(event: TouchEvent<HTMLDivElement>) {
    if (!canSwipeActions || !swipeStateRef.current) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - swipeStateRef.current.startX;
    const deltaY = touch.clientY - swipeStateRef.current.startY;

    if (!swipeStateRef.current.dragging) {
      if (Math.abs(deltaX) < 6) return;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        swipeStateRef.current = null;
        return;
      }
      swipeStateRef.current.dragging = true;
    }

    event.preventDefault();
    const nextOffset = Math.max(
      -swipeActionsWidth,
      Math.min(0, swipeStateRef.current.initialOffset + deltaX)
    );
    setSwipeOffset(nextOffset);
  }

  function handleSwipeEnd() {
    if (!canSwipeActions || !swipeStateRef.current) return;
    const threshold = swipeActionsWidth * 0.45;
    setSwipeOffset((prev) => (Math.abs(prev) >= threshold ? -swipeActionsWidth : 0));
    swipeStateRef.current = null;
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {canSwipeActions ? (
        <div className="absolute inset-y-0 right-0 flex items-stretch">
          {archiveTarget ? (
            <button
              type="button"
              onClick={(event) => void handleStatusUpdate(archiveTarget, "archive", event)}
              disabled={actionLoading != null}
              className="flex w-[88px] items-center justify-center gap-1.5 bg-gray-700 px-2 text-xs font-semibold text-white disabled:opacity-70"
            >
              {actionLoading === "archive" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Archive className="h-3.5 w-3.5" aria-hidden />
              )}
              Архив
            </button>
          ) : null}
          {confirmTarget ? (
            <button
              type="button"
              onClick={(event) => void handleStatusUpdate(confirmTarget, "confirm", event)}
              disabled={actionLoading != null}
              className="flex w-[88px] items-center justify-center gap-1.5 bg-emerald-600 px-2 text-xs font-semibold text-white disabled:opacity-70"
            >
              {actionLoading === "confirm" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden />
              )}
              {confirmTarget === "confirmed" ? "Принять" : "В работу"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className="relative z-10 bg-white transition-transform duration-150 ease-out"
        style={canSwipeActions ? { transform: `translateX(${swipeOffset}px)` } : undefined}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
        onTouchCancel={handleSwipeEnd}
      >
        <Link href={bookingHref} className="block p-3 sm:p-4" onClick={() => setSwipeOffset(0)}>
          <div className="flex gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={booking.tourImage}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-charcoal group-hover:text-sky">
                  {booking.tourTitle}
                </p>
                <BookingStatusBadge status={booking.status} className="shrink-0" />
              </div>
              <p className="mt-1 text-xs text-slate">
                №{displayNumber} · {formatBookingCreatedAt(booking.createdAt)}
              </p>
              <p className="mt-1 text-xs font-medium text-charcoal">
                {booking.contactName}
                {showContacts && booking.contactPhone ? (
                  <span className="font-normal text-slate"> · {booking.contactPhone}</span>
                ) : null}
              </p>
              {!compact ? (
                <>
                  <p className="mt-1 text-xs text-slate">
                    {formatBookingTourDates(booking, "Даты по согласованию")} · {booking.guests}{" "}
                    {booking.guests === 1 ? "гость" : booking.guests < 5 ? "гостя" : "гостей"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-charcoal">
                    <BookingLedgerAmount booking={booking} priceUsd={booking.totalPriceUsd} compact />
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </Link>

        <div
          className={cn(
            "flex gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2.5 sm:px-4",
            "snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]",
            "touch-manipulation"
          )}
        >
          {confirmTarget ? (
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={actionLoading != null}
              onClick={(event) => void handleStatusUpdate(confirmTarget, "confirm", event)}
              className="h-11 min-w-[7.5rem] shrink-0 snap-start px-3 text-xs"
            >
              {actionLoading === "confirm" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden />
              )}
              {confirmTarget === "confirmed" ? "Подтвердить" : "В обработку"}
            </Button>
          ) : null}
          {archiveTarget ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={actionLoading != null}
              onClick={(event) => void handleStatusUpdate(archiveTarget, "archive", event)}
              className="h-11 min-w-[7.5rem] shrink-0 snap-start px-3 text-xs"
            >
              {actionLoading === "archive" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Archive className="h-3.5 w-3.5" aria-hidden />
              )}
              В архив
            </Button>
          ) : null}
          <Link
            href={messageHref}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "h-11 min-w-[7.5rem] shrink-0 snap-start px-3 text-xs"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            Написать
          </Link>
          <Link
            href={tourHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "h-11 min-w-[7.5rem] shrink-0 snap-start px-3 text-xs"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Тур
          </Link>
          <Link
            href={bookingHref}
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "h-11 min-w-[7.5rem] shrink-0 snap-start px-3 text-xs text-slate"
            )}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />
            Заявка
          </Link>
        </div>
      </div>

      {actionError ? (
        <p className="border-t border-gray-100 px-3 py-2 text-xs text-red-600 sm:px-4">
          {actionError}
        </p>
      ) : null}
    </article>
  );
}
