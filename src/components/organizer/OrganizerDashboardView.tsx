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
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerCabinetBookingStats } from "@/lib/organizer-bookings";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import type { OrganizerBookingStats } from "@/types/tourist";

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
    <article className={cn("rounded-2xl border border-gray-200 bg-white p-5 shadow-sm", className)}>
      <h3 className="font-display text-base font-bold text-charcoal">{title}</h3>
      <div className="mt-3">{children}</div>
    </article>
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
        "rounded-2xl border bg-white p-4 shadow-sm transition-colors hover:border-brand/30",
        tone
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-charcoal">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-brand">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}

export default function OrganizerDashboardView() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [publicToursUrl, setPublicToursUrl] = useState("https://argentina-travel.ru/tours");
  const [bookingStats, setBookingStats] = useState<OrganizerBookingStats>({
    newCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    activeInboxCount: 0,
  });

  useEffect(() => {
    setPublicToursUrl(`${window.location.origin}/tours`);
  }, []);

  useEffect(() => {
    if (!user) return;

    function refreshStats() {
      setBookingStats(getOrganizerCabinetBookingStats(user!.id));
    }

    refreshStats();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshStats);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshStats);
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
      <div className="rounded-2xl border border-brand/15 bg-brand-light/50 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
            <Send className="h-4 w-4" />
          </div>
          <p className="text-sm leading-relaxed text-charcoal">
            Настройте уведомления о новых заявках в мессенджер.{" "}
            <button type="button" className="font-semibold text-brand hover:underline">
              Подключить
            </button>
          </p>
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">Дашборд</h1>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-charcoal">Заявки</h2>
            <p className="mt-1 text-sm text-slate">CRM по входящим бронированиям</p>
          </div>
          <Link
            href="/organizer/bookings"
            className="text-sm font-medium text-brand hover:underline"
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
          <StatusBadge label="Пройдена" />
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Для верификации личности потребуется паспорт и камера. Подойдёт камера мобильного
            телефона.
          </p>
        </DashboardCard>

        <DashboardCard title="Проверка данных">
          <StatusBadge label="Пройдена" />
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Администраторы проверяют данные новых пользователей. Проверка занимает до 5 рабочих
            дней.
          </p>
        </DashboardCard>

        <DashboardCard title="Поддержка">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Headphones className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Есть вопросы? Напишите в чат поддержки.
          </p>
          <Link
            href="/contacts"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-charcoal transition-colors hover:bg-gray-50"
          >
            Перейти в чат
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
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Пока нет документов. Когда партнёр пришлёт отчётные документы, здесь появится кнопка
            для их скачивания.
          </p>
        </DashboardCard>

        <DashboardCard title="Способ получения выплат">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Coins className="h-5 w-5" />
          </div>
          <div className="mt-3 space-y-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              На карту банка РФ
            </span>
            <p className="text-sm font-medium text-charcoal">МИР 2200 **** **** **99</p>
            <p className="text-xs leading-relaxed text-slate">
              Платежи обрабатываются партнёром. Реквизиты хранятся на стороне платёжного сервиса.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-4">
            Изменить
          </Button>
        </DashboardCard>

        <DashboardCard title="Правила работы" className="xl:col-span-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            Ознакомьтесь с{" "}
            <Link href="/contacts" className="font-medium text-brand hover:underline">
              правилами работы
            </Link>{" "}
            на площадке, а также с{" "}
            <Link href="/join" className="font-medium text-brand hover:underline">
              договором для организаторов
            </Link>
            .
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}
