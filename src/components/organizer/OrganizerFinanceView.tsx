"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PiggyBank, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FormattedPrice from "@/components/FormattedPrice";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import {
  cabinetCardClass,
  cabinetHeroClass,
  cabinetTableHeaderClass,
  cabinetTableWrapClass,
} from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import type { AnalyticsPeriod } from "@/types/admin-analytics";
import { ANALYTICS_PERIOD_LABELS } from "@/types/admin-analytics";
import type { OrganizerFinanceSummary, BookingCommissionSnapshotRow } from "@/types/platform-commission";
import type { PayoutRecordRow } from "@/types/payment-platform";
import { PAYOUT_RECORD_STATUS_LABELS } from "@/types/payment-platform";

type FinanceApiResponse = {
  period?: AnalyticsPeriod;
  summary?: OrganizerFinanceSummary;
  snapshots?: BookingCommissionSnapshotRow[];
  payouts?: PayoutRecordRow[];
  error?: string;
};

export default function OrganizerFinanceView() {
  const supabaseMode = isSupabaseBookingsEnabled();
  const [period, setPeriod] = useState<AnalyticsPeriod>("90d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<OrganizerFinanceSummary | null>(null);
  const [snapshots, setSnapshots] = useState<BookingCommissionSnapshotRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecordRow[]>([]);

  const loadFinance = useCallback(async () => {
    if (!supabaseMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/finance/summary?period=${period}`);
      const json = (await res.json()) as FinanceApiResponse;
      if (!res.ok) {
        setError(json.error ?? "Не удалось загрузить финансовую сводку");
        return;
      }
      setSummary(json.summary ?? null);
      setSnapshots(json.snapshots ?? []);
      setPayouts(json.payouts ?? []);
    } catch {
      setError("Не удалось загрузить финансовую сводку");
    } finally {
      setLoading(false);
    }
  }, [period, supabaseMode]);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  return (
    <div className="space-y-6">
      <header className={cabinetHeroClass}>
        <h1 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">Финансы</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate">
          Заработанные средства после комиссии платформы, ожидающие выплаты и история начислений.
          Выплаты на счёт организатора подтверждаются администратором вручную — без автоматических
          банковских переводов.
        </p>
      </header>

      {!supabaseMode ? (
        <EmptyState
          icon={Wallet}
          title="Финансовая сводка недоступна"
          description="Подключите Supabase для отображения начислений и выплат по реальным платежам."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              value={period}
              onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
              className="w-40"
            >
              {(Object.keys(ANALYTICS_PERIOD_LABELS) as AnalyticsPeriod[]).map((value) => (
                <option key={value} value={value}>
                  {ANALYTICS_PERIOD_LABELS[value]}
                </option>
              ))}
            </NativeSelect>
            <button
              type="button"
              onClick={() => void loadFinance()}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              Обновить
            </button>
            <Link
              href="/organizer/payments"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-sky transition-colors hover:bg-gray-50"
            >
              Платежи по заявкам
            </Link>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {summary ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={cn(cabinetCardClass, "p-5")}>
                <p className="text-sm text-slate">Заработано (нетто)</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.earnedNet} />
                </p>
                <p className="mt-1 text-xs text-slate">
                  Брутто: <FormattedPrice priceUsd={summary.grossTotal} />
                </p>
              </div>
              <div className={cn(cabinetCardClass, "p-5")}>
                <p className="text-sm text-slate">Комиссия платформы</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.commissionTotal} />
                </p>
              </div>
              <div className={cn(cabinetCardClass, "p-5")}>
                <p className="text-sm text-slate">Ожидает выплаты</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.pendingPayout} />
                </p>
              </div>
              <div className={cn(cabinetCardClass, "p-5")}>
                <p className="text-sm text-slate">Доступно для выплаты</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.availableBalance} />
                </p>
                <p className="mt-1 text-xs text-slate">
                  Выплачено: <FormattedPrice priceUsd={summary.paidOut} />
                </p>
              </div>
            </div>
          ) : loading ? (
            <p className="text-sm text-slate">Загрузка…</p>
          ) : null}

          {payouts.length > 0 ? (
            <section className={cn(cabinetCardClass, "p-4 sm:p-6")}>
              <h2 className="font-heading text-base font-bold text-charcoal">Пакеты выплат</h2>
              <div className={cn(cabinetTableWrapClass, "mt-4")}>
                <Table>
                  <TableHeader>
                    <TableRow className={cabinetTableHeaderClass}>
                      <TableHead>Период</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm">{row.period}</TableCell>
                        <TableCell className="text-sm">
                          {PAYOUT_RECORD_STATUS_LABELS[row.status]}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          <FormattedPrice priceUsd={row.amount} />
                        </TableCell>
                        <TableCell className="text-sm text-slate">
                          {formatBookingCreatedAt(row.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ) : null}

          {snapshots.length > 0 ? (
            <section className={cn(cabinetCardClass, "p-4 sm:p-6")}>
              <h2 className="font-heading text-base font-bold text-charcoal">
                Начисления по оплатам
              </h2>
              <p className="mt-1 text-sm text-slate">
                Разбивка комиссии при каждом успешном списании
              </p>
              <div className={cn(cabinetTableWrapClass, "mt-4")}>
                <Table>
                  <TableHeader>
                    <TableRow className={cabinetTableHeaderClass}>
                      <TableHead>Заявка / тур</TableHead>
                      <TableHead className="text-right">Брутто</TableHead>
                      <TableHead className="text-right">Комиссия</TableHead>
                      <TableHead className="text-right">Ваш доход</TableHead>
                      <TableHead>Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm">
                          <Link
                            href={`/organizer/bookings/${row.bookingId}`}
                            className="font-medium text-charcoal hover:text-sky"
                          >
                            #{row.bookingId.slice(-6)}
                          </Link>
                          {row.tourTitle ? (
                            <p className="mt-0.5 truncate text-xs text-slate">{row.tourTitle}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <FormattedPrice priceUsd={row.grossAmount} />
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate">
                          <FormattedPrice priceUsd={row.commissionAmount} />
                          {row.commissionPercent != null ? (
                            <span className="text-xs"> ({row.commissionPercent}%)</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          <FormattedPrice priceUsd={row.organizerNetAmount} />
                        </TableCell>
                        <TableCell className="text-sm text-slate">
                          {formatBookingCreatedAt(row.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ) : !loading ? (
            <EmptyState
              icon={PiggyBank}
              title="Начислений пока нет"
              description="После успешных оплат туристов здесь появится разбивка комиссии и вашего дохода."
            />
          ) : null}
        </>
      )}
    </div>
  );
}
