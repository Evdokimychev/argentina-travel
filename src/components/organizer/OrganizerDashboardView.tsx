"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  FileText,
  Headphones,
  Inbox,
  Send,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { cabinetHeroClass, cabinetLinkClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerCabinetBookingStats } from "@/lib/organizer-bookings";
import { getOrganizerAnalytics, type OrganizerAnalytics } from "@/lib/organizer-analytics";
import FormattedPrice from "@/components/FormattedPrice";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import type { OrganizerBookingStats } from "@/types/tourist";
import { ORGANIZER_TOURS_UPDATED_EVENT } from "@/types/organizer-tour";
import { MESSAGES_UPDATED_EVENT } from "@/types/messages";

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

function DashboardCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="p-5 pb-0 sm:p-5 sm:pb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-3 sm:p-5 sm:pt-3">{children}</CardContent>
    </Card>
  );
}

function BookingStatCard({
  label,
  value,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  icon: typeof Inbox;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-3xl border bg-white p-4 shadow-card transition-colors hover:border-sky/30 hover:shadow-elevated",
        tone
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate">{label}</p>
          <p className="mt-2 font-heading text-3xl font-bold text-charcoal">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-sky">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}

export default function OrganizerDashboardView() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [publicToursUrl, setPublicToursUrl] = useState("/tours");
  const [bookingStats, setBookingStats] = useState<OrganizerBookingStats>({
    newCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    activeInboxCount: 0,
  });
  const [analytics, setAnalytics] = useState<OrganizerAnalytics | null>(null);

  useEffect(() => {
    setPublicToursUrl(`${window.location.origin}/tours`);
  }, []);

  useEffect(() => {
    if (!user) return;

    function refreshStats() {
      setBookingStats(getOrganizerCabinetBookingStats(user!.id));
      setAnalytics(getOrganizerAnalytics(user!.id));
    }

    refreshStats();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshStats);
    window.addEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refreshStats);
    window.addEventListener(MESSAGES_UPDATED_EVENT, refreshStats);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshStats);
      window.removeEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refreshStats);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, refreshStats);
    };
  }, [user]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicToursUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-sky/15 bg-gradient-to-r from-sky/8 via-white to-sky/5 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sky shadow-sm">
            <Send className="h-4 w-4" />
          </div>
          <p className="text-sm leading-relaxed text-charcoal">
            Настройте уведомления о новых заявках в мессенджер.{" "}
            <button type="button" className="font-semibold text-sky hover:underline">
              Подключить
            </button>
          </p>
        </div>
      </div>

      <section className={cabinetHeroClass}>
        <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">Обзор</h1>
        <p className="mt-2 text-sm text-slate">
          Статистика заявок, туров и ключевые действия в кабинете организатора.
        </p>
        <Link href="/organizer/analytics" className={cn(cabinetLinkClass, "mt-3 inline-flex")}>
          Открыть аналитику →
        </Link>
      </section>

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
          </div>
        </section>
      ) : null}

      <section className={cabinetPanelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Заявки</h2>
            <p className="mt-1 text-sm text-slate">Воронка по статусам — данные из ваших заявок</p>
          </div>
          <Link
            href="/organizer/bookings"
            className={cabinetLinkClass}
          >
            Все заявки
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <BookingStatCard
            label={BOOKING_STATUS_LABELS.new}
            value={bookingStats.newCount}
            href="/organizer/bookings?status=new"
            icon={Inbox}
            tone="border-violet-100 bg-violet-50/40"
          />
          <BookingStatCard
            label={BOOKING_STATUS_LABELS.pending}
            value={bookingStats.pendingCount}
            href="/organizer/bookings?status=pending"
            icon={CalendarClock}
            tone="border-amber-100 bg-amber-50/40"
          />
          <BookingStatCard
            label={BOOKING_STATUS_LABELS.confirmed}
            value={bookingStats.confirmedCount}
            href="/organizer/bookings?status=confirmed"
            icon={CheckCircle2}
            tone="border-emerald-100 bg-emerald-50/40"
          />
          <BookingStatCard
            label={BOOKING_STATUS_LABELS.completed}
            value={bookingStats.completedCount}
            href="/organizer/bookings?status=completed"
            icon={CheckCircle2}
            tone="border-sky/20 bg-sky/5"
          />
          <BookingStatCard
            label={BOOKING_STATUS_LABELS.cancelled}
            value={bookingStats.cancelledCount}
            href="/organizer/bookings?status=cancelled"
            icon={XCircle}
            tone="border-gray-200 bg-gray-50"
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardCard title="Верификация личности">
          <StatusBadge label="Скоро" />
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Проверка документов организаторов появится на следующем этапе. Пока вы можете
            публиковать туры и принимать заявки.
          </p>
        </DashboardCard>

        <DashboardCard title="Проверка данных">
          <StatusBadge label="Не требуется" />
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Модерация новых организаторов будет подключена вместе с расширением маркетплейса.
          </p>
        </DashboardCard>

        <DashboardCard title="Сообщения">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Headphones className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Переписка с туристами по турам и заявкам — в кабинете, без почты.
          </p>
          <Link
            href="/organizer/messages"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-charcoal transition-colors hover:bg-gray-50"
          >
            Открыть сообщения
          </Link>
        </DashboardCard>

        <DashboardCard title="Поддержка платформы">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Вопросы по работе площадки — через форму контактов.
          </p>
          <Link
            href="/contacts"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-charcoal transition-colors hover:bg-gray-50"
          >
            Написать в поддержку
          </Link>
        </DashboardCard>

        <DashboardCard title="Моя страница с турами">
          <p className="text-sm leading-relaxed text-slate">
            Посмотрите, как выглядит ваша страница с турами на сайте партнёра
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={publicToursUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-sky px-3 text-xs font-semibold text-white transition-colors hover:bg-sky-dark"
            >
              <ExternalLink className="h-4 w-4" />
              Открыть
            </a>
            <Button type="button" size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard title="Отчётные документы">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Пока нет документов. Когда партнёр пришлёт отчётные документы, здесь появится кнопка
            для их скачивания.
          </p>
        </DashboardCard>

        <DashboardCard title="Способ получения выплат">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Coins className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Подключение выплат через партнёра будет доступно позже. Сейчас вы можете принимать
            заявки и согласовывать оплату с путешественниками напрямую.
          </p>
          <span className="mt-4 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-slate">
            Скоро
          </span>
        </DashboardCard>

        <DashboardCard title="Правила работы" className="xl:col-span-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Ознакомьтесь с{" "}
            <Link href="/contacts" className="font-medium text-sky hover:underline">
              правилами работы
            </Link>{" "}
            на площадке, а также с{" "}
            <Link href="/join" className="font-medium text-sky hover:underline">
              договором для организаторов
            </Link>
            .
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}
