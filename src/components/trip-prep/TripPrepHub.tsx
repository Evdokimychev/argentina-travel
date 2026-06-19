"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, Loader2 } from "lucide-react";
import TripPrepChecklist from "@/components/trip-prep/TripPrepChecklist";
import { formatBookingTourDates } from "@/lib/booking-display";
import { getBookingById } from "@/lib/bookings-store";
import { apiFetchBookingById, isRemoteBookingsMode } from "@/lib/bookings-api";
import {
  apiFetchTripPrepChecklist,
  apiToggleTripPrepProgress,
  isRemoteTripPrepMode,
} from "@/lib/trip-prep-api";
import {
  buildLocalTripPrepChecklist,
  toggleLocalTripPrepProgress,
} from "@/lib/trip-prep-local";
import { canTouristAccessBooking } from "@/lib/booking-payment-display";
import { useAuth } from "@/context/AuthContext";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import type { TripPrepChecklistResponse } from "@/types/trip-prep";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { cn } from "@/lib/cn";

interface TripPrepHubProps {
  bookingId?: string;
  compact?: boolean;
  className?: string;
}

export default function TripPrepHub({ bookingId, compact = false, className }: TripPrepHubProps) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checklist, setChecklist] = useState<TripPrepChecklistResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadChecklist = useCallback(
    async (targetBooking: Booking) => {
      if (isRemoteTripPrepMode()) {
        const payload = await apiFetchTripPrepChecklist(targetBooking.id);
        setChecklist(payload);
        return;
      }
      setChecklist(buildLocalTripPrepChecklist(targetBooking));
    },
    []
  );

  useEffect(() => {
    if (!bookingId || !user) return;

    async function refresh() {
      setLoading(true);
      setError(null);
      try {
        const nextBooking = isRemoteBookingsMode()
          ? await apiFetchBookingById(bookingId!)
          : getBookingById(bookingId!) ?? null;

        if (!nextBooking) {
          setBooking(null);
          setChecklist(null);
          setError("Бронирование не найдено");
          return;
        }

        if (!canTouristAccessBooking(nextBooking, user!.id, user!.email)) {
          setBooking(null);
          setChecklist(null);
          setError("Нет доступа к этой заявке");
          return;
        }

        setBooking(nextBooking);
        await loadChecklist(nextBooking);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить чек-лист");
      } finally {
        setLoading(false);
      }
    }

    void refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [bookingId, user, loadChecklist]);

  async function handleToggle(itemId: string, checked: boolean) {
    if (!booking || !checklist) return;
    setSavingItemId(itemId);
    setError(null);

    try {
      if (isRemoteTripPrepMode()) {
        const next = await apiToggleTripPrepProgress({
          bookingId: booking.id,
          itemId,
          checked,
        });
        setChecklist(next);
      } else {
        toggleLocalTripPrepProgress({ bookingId: booking.id, itemId, checked });
        setChecklist(buildLocalTripPrepChecklist(booking));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить прогресс");
    } finally {
      setSavingItemId(null);
    }
  }

  if (!user) return null;

  if (!bookingId) {
    return (
      <div className={cn("rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm", className)}>
        <ClipboardCheck className="mx-auto h-8 w-8 text-brand" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-slate">Выберите бронирование, чтобы открыть чек-лист подготовки.</p>
        <Link
          href="/profile/bookings"
          className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
        >
          К списку бронирований
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !checklist || !booking) {
    return (
      <InlineFeedback
        variant="error"
        title="Чек-лист недоступен"
        description={error ?? "Попробуйте обновить страницу"}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!compact ? (
        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-sky-100">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-bold text-charcoal">Подготовка к поездке</h2>
              <p className="mt-1 text-sm text-slate">{checklist.tourTitle}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatBookingTourDates(booking, "Даты по согласованию")}
              </p>
              <p className="mt-2 text-xs text-slate">
                Шаблон: {checklist.template.name}. Правила въезда и документы могут меняться — уточняйте перед поездкой.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <TripPrepChecklist
        categories={checklist.categories}
        summary={checklist.summary}
        onToggle={(itemId, checked) => void handleToggle(itemId, checked)}
        disabled={Boolean(savingItemId)}
        compact={compact}
      />
    </div>
  );
}
