"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PiggyBank, Wallet } from "lucide-react";
import {
  CabinetTableWrap,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cabinetTableHeaderClass,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FormattedPrice from "@/components/FormattedPrice";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { cabinetHeroClass } from "@/lib/cabinet-ui";
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void loadFinance()}
              disabled={loading}
            >
              Обновить
            </Button>
            <Link
              href="/organizer/payments"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Платежи по заявкам
            </Link>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {summary ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card variant="cabinet" className="p-5">
                <p className="text-sm text-slate">Заработано (нетто)</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.earnedNet} />
                </p>
                <p className="mt-1 text-xs text-slate">
                  Брутто: <FormattedPrice priceUsd={summary.grossTotal} />
                </p>
              </Card>
              <Card variant="cabinet" className="p-5">
                <p className="text-sm text-slate">Комиссия платформы</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.commissionTotal} />
                </p>
              </Card>
              <Card variant="cabinet" className="p-5">
                <p className="text-sm text-slate">Ожидает выплаты</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.pendingPayout} />
                </p>
              </Card>
              <Card variant="cabinet" className="p-5">
                <p className="text-sm text-slate">Доступно для выплаты</p>
                <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                  <FormattedPrice priceUsd={summary.availableBalance} />
                </p>
                <p className="mt-1 text-xs text-slate">
                  Выплачено: <FormattedPrice priceUsd={summary.paidOut} />
                </p>
              </Card>
            </div>
          ) : loading ? (
            <p className="text-sm text-slate">Загрузка…</p>
          ) : null}

          {payouts.length > 0 ? (
            <Card variant="cabinet" className="p-4 sm:p-6">
              <h2 className="font-heading text-base font-bold text-charcoal">Пакеты выплат</h2>
              <CabinetTableWrap className="mt-4">
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
              </CabinetTableWrap>
            </Card>
          ) : null}

          {snapshots.length > 0 ? (
            <Card variant="cabinet" className="p-4 sm:p-6">
              <h2 className="font-heading text-base font-bold text-charcoal">
                Начисления по оплатам
              </h2>
              <p className="mt-1 text-sm text-slate">
                Разбивка комиссии при каждом успешном списании
              </p>
              <CabinetTableWrap className="mt-4">
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
              </CabinetTableWrap>
            </Card>
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
