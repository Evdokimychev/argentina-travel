"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Mail, MessageSquare } from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import FormattedPrice from "@/components/FormattedPrice";
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

export default function OrganizerBookingCard({
  booking,
  compact = false,
  className,
}: OrganizerBookingCardProps) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const currentStatus = isActiveBookingStatus(booking.status) ? booking.status : "pending";
  const confirmTarget = getConfirmTarget(currentStatus);
  const showContacts = canOrganizerSeeContactDetails(booking.status);
  const displayNumber = formatBookingDisplayNumber(booking.id);
  const messageHref = buildOrganizerBookingMessageHref(booking.id);
  const tourHref = `/tours/${booking.tourSlug}`;
  const bookingHref = `/organizer/bookings/${booking.id}`;

  async function handleConfirm(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirmTarget || confirming) return;

    setConfirming(true);
    setConfirmError(null);

    try {
      if (isRemoteBookingsMode()) {
        await apiUpdateBookingStatus({
          bookingId: booking.id,
          status: confirmTarget,
          changedBy: "organizer",
        });
      } else {
        const result = updateBookingStatusWithHistory({
          bookingId: booking.id,
          status: confirmTarget,
          changedBy: "organizer",
          actor: user,
        });
        if ("error" in result) {
          setConfirmError(result.error);
        }
      }
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "Не удалось обновить статус");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <article
      className={cn(
        "group rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link href={bookingHref} className="block p-3 sm:p-4">
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
                  <FormattedPrice priceUsd={booking.totalPriceUsd} />
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
            disabled={confirming}
            onClick={(event) => void handleConfirm(event)}
            className="h-11 min-w-[7.5rem] shrink-0 snap-start px-3 text-xs"
          >
            {confirming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden />
            )}
            {confirmTarget === "confirmed" ? "Подтвердить" : "В обработку"}
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

      {confirmError ? (
        <p className="border-t border-gray-100 px-3 py-2 text-xs text-red-600 sm:px-4">
          {confirmError}
        </p>
      ) : null}
    </article>
  );
}
