"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CreditCard,
  FilePenLine,
  ListChecks,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { cabinetHeroClass, cabinetLinkClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import { CabinetDashboardSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
  getOrganizerBookingsForCabinet,
  getOrganizerCabinetBookingStats,
} from "@/lib/organizer-bookings";
import { getOrganizerAnalytics, type OrganizerAnalytics } from "@/lib/organizer-analytics";
import { apiFetchOrganizerBookings, isRemoteBookingsMode } from "@/lib/bookings-api";
import { getUnreadMessagesCount } from "@/lib/messages-store";
import FormattedPrice from "@/components/FormattedPrice";
import OrganizerInboxView from "@/components/organizer/OrganizerInboxView";
import OrganizerBookingsKanban from "@/components/organizer/OrganizerBookingsKanban";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import type { OrganizerBookingStats } from "@/types/tourist";
import { ORGANIZER_TOURS_UPDATED_EVENT } from "@/types/organizer-tour";
import { MESSAGES_UPDATED_EVENT } from "@/types/messages";
import { ORGANIZER_INBOX_UPDATED_EVENT } from "@/types/organizer-inbox";
import { ActionQueue, type ActionQueueItem } from "@/components/workspace/ActionQueue";

export default function OrganizerDashboardView() {
  const { user } = useAuth();
  const [bookingStats, setBookingStats] = useState<OrganizerBookingStats>({
    newCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    activeInboxCount: 0,
  });
  const [analytics, setAnalytics] = useState<OrganizerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const hasAnyTours = (analytics?.publishedToursCount ?? 0) + (analytics?.draftToursCount ?? 0) > 0;
  const showOnboardingEmptyState = !hasAnyTours && bookings.length === 0;

  useEffect(() => {
    if (!user) return;

    function refreshBookings() {
      if (isRemoteBookingsMode()) {
        return apiFetchOrganizerBookings()
          .then(setBookings)
          .catch(() => setBookings([]));
      }
      setBookings(getOrganizerBookingsForCabinet(user!.id));
      return Promise.resolve();
    }

    function refreshStats() {
      setBookingStats(getOrganizerCabinetBookingStats(user!.id));
      setAnalytics(getOrganizerAnalytics(user!.id));
      setUnreadMessages(getUnreadMessagesCount({ userId: user!.id, role: "organizer" }));
      void refreshBookings().finally(() => setLoading(false));
    }

    refreshStats();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshStats);
    window.addEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refreshStats);
    window.addEventListener(MESSAGES_UPDATED_EVENT, refreshStats);
    window.addEventListener(ORGANIZER_INBOX_UPDATED_EVENT, refreshStats);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshStats);
      window.removeEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refreshStats);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, refreshStats);
      window.removeEventListener(ORGANIZER_INBOX_UPDATED_EVENT, refreshStats);
    };
  }, [user]);

  if (loading) {
    return <CabinetDashboardSkeleton title="Загружаем обзор кабинета…" />;
  }

  const actionItems: ActionQueueItem[] = [
    ...(bookingStats.activeInboxCount > 0
      ? [{
          id: "new-bookings",
          title: `${bookingStats.activeInboxCount} ${bookingStats.activeInboxCount === 1 ? "заявка ждёт ответа" : "заявки ждут ответа"}`,
          description: "Подтвердите детали или свяжитесь с путешественником.",
          href: "/organizer/bookings?status=new",
          label: "Разобрать",
          priority: "high" as const,
          count: bookingStats.activeInboxCount,
          icon: CalendarClock,
        }]
      : []),
    ...(unreadMessages > 0
      ? [{
          id: "unread-messages",
          title: `${unreadMessages} ${unreadMessages === 1 ? "непрочитанное сообщение" : "непрочитанных сообщения"}`,
          description: "Ответьте туристам, чтобы не задерживать решение по поездке.",
          href: "/organizer/messages",
          label: "Ответить",
          priority: "medium" as const,
          count: unreadMessages,
          icon: Mail,
        }]
      : []),
    ...((analytics?.pendingPaymentsCount ?? 0) > 0
      ? [{
          id: "pending-payments",
          title: `${analytics?.pendingPaymentsCount ?? 0} оплат ожидают завершения`,
          description: "Проверьте состояние оплат по активным бронированиям.",
          href: "/organizer/finance",
          label: "Проверить",
          priority: "medium" as const,
          count: analytics?.pendingPaymentsCount ?? 0,
          icon: CreditCard,
        }]
      : []),
    ...((analytics?.draftToursCount ?? 0) > 0
      ? [{
          id: "draft-tours",
          title: `${analytics?.draftToursCount ?? 0} ${analytics?.draftToursCount === 1 ? "тур остался в черновиках" : "тура остались в черновиках"}`,
          description: "Продолжите заполнение и отправьте готовое предложение на публикацию.",
          href: "/organizer/tours?status=draft",
          label: "Продолжить",
          priority: "low" as const,
          count: analytics?.draftToursCount ?? 0,
          icon: FilePenLine,
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <section className={cabinetHeroClass}>
        <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
          Входящие и заявки
        </h1>
        <p className="mt-2 text-sm text-slate">
          Новые бронирования, сообщения и заявки, требующие вашего внимания.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {bookingStats.activeInboxCount > 0 ? (
            <Link
              href="/organizer/bookings?status=new"
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 transition-colors hover:bg-violet-200"
            >
              {bookingStats.activeInboxCount} активных заявок
            </Link>
          ) : null}
          {unreadMessages > 0 ? (
            <Link
              href="/organizer/messages"
              className="inline-flex items-center gap-1.5 rounded-full bg-sky/10 px-3 py-1.5 text-xs font-semibold text-sky transition-colors hover:bg-sky/20"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {unreadMessages} непрочитанных
            </Link>
          ) : null}
          <Link href="/organizer/analytics" className={cn(cabinetLinkClass, "inline-flex text-xs")}>
            Аналитика →
          </Link>
        </div>
      </section>

      <ActionQueue
        title="Что требует внимания сегодня"
        description="Только реальные заявки, сообщения и рабочие задачи."
        items={actionItems}
        emptyTitle="Входящие разобраны"
        emptyDescription="Новых заявок, сообщений и незавершённых оплат сейчас нет."
      />

      {showOnboardingEmptyState ? (
        <section className={cn(cabinetPanelClass, "border-sky/20 bg-sky/5")}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky shadow-sm">
              <ListChecks className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-bold text-charcoal">С чего начать</h2>
              <p className="mt-1 text-sm text-slate">
                Кабинет готов. Пройдите три шага, чтобы получить первую заявку.
              </p>
              <ol className="mt-4 space-y-2 text-sm text-charcoal">
                <li>1. Заполните профиль организатора и контакты.</li>
                <li>2. Создайте первый тур в редакторе.</li>
                <li>3. Опубликуйте тур и дождитесь первого бронирования.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/organizer/tours?welcome=1" className={cn(cabinetLinkClass, "inline-flex")}>
                  Открыть пошаговый мастер →
                </Link>
                <Link href="/organizer/settings" className={cn(cabinetLinkClass, "inline-flex")}>
                  Настроить профиль →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <OrganizerInboxView />
          <OrganizerBookingsKanban bookings={bookings} limitPerColumn={3} />
        </div>
      )}

      {analytics ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-card">
            <p className="text-sm text-slate">Выручка (подтверждённые)</p>
            <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
              <FormattedPrice priceUsd={analytics.revenueUsd} />
            </p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-4 shadow-card">
            <p className="text-sm text-slate">Ожидают оплаты</p>
            <p className="mt-2 font-heading text-3xl font-bold text-charcoal">
              {analytics.pendingPaymentsCount}
            </p>
          </div>
          <div className="rounded-3xl border border-sky/20 bg-sky/5 p-4 shadow-card">
            <p className="text-sm text-slate">Туры в каталоге</p>
            <p className="mt-2 font-heading text-3xl font-bold text-charcoal">
              {analytics.publishedToursCount}
              <span className="ml-2 text-base font-medium text-slate">
                / {analytics.draftToursCount} черн.
              </span>
            </p>
          </div>
          <div className="rounded-3xl border border-violet-100 bg-violet-50/40 p-4 shadow-card">
            <p className="text-sm text-slate">Конверсия в подтверждение</p>
            <p className="mt-2 font-heading text-3xl font-bold text-charcoal">
              {analytics.conversionRate != null ? `${analytics.conversionRate}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-slate">
              {analytics.conversionFunnel.started > 0
                ? `${analytics.conversionFunnel.confirmed} из ${analytics.conversionFunnel.started} заявок`
                : "Нет заявок"}
            </p>
          </div>
        </section>
      ) : null}

      {analytics && analytics.conversionFunnel.started > 0 ? (
        <section className={cabinetPanelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-charcoal">Мини-воронка</h2>
              <p className="mt-1 text-sm text-slate">Конверсия по вашим заявкам (без отменённых)</p>
            </div>
            <Link href="/organizer/analytics" className={cabinetLinkClass}>
              Подробная аналитика →
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              {
                label: "Заявки",
                value: analytics.conversionFunnel.started,
                pct: null,
              },
              {
                label: "Подтверждены",
                value: analytics.conversionFunnel.confirmed,
                pct: analytics.conversionFunnel.bookingToConfirmedPct,
              },
              {
                label: "Оплачены",
                value: analytics.conversionFunnel.paid,
                pct: analytics.conversionFunnel.bookingToPaidPct,
              },
              {
                label: "Отзывы",
                value: analytics.conversionFunnel.reviewed,
                pct: analytics.conversionFunnel.bookingToReviewPct,
              },
            ].map((step) => (
              <div
                key={step.label}
                className="rounded-2xl border border-gray-100 bg-white px-3 py-3 text-center shadow-sm"
              >
                <p className="text-xs text-slate">{step.label}</p>
                <p className="mt-1 font-heading text-xl font-bold text-charcoal">{step.value}</p>
                {step.pct != null ? (
                  <p className="mt-0.5 text-xs font-medium text-sky">{step.pct}% от заявок</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
}
