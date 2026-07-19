"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, PiggyBank, Wallet } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { cabinetHeroClass } from "@/lib/cabinet-ui";
import { formatLedgerAmount } from "@/lib/payments/format-money";
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
  const [statementLoading, setStatementLoading] = useState(false);

  const downloadStatement = useCallback(async () => {
    setStatementLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/finance/statement?period=${period}`);
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Не удалось скачать выписку");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `organizer-statement-${period}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось скачать выписку");
    } finally {
      setStatementLoading(false);
    }
  }, [period]);

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
          description="Учёт начислений и выплат пока не подключён для этого кабинета. Обратитесь к администратору сайта."
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void downloadStatement()}
              disabled={statementLoading || loading}
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden />
              Скачать выписку CSV
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
            <div className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summary.byCurrency.map((bucket) => (
                  <Card key={bucket.currency} variant="cabinet" className="p-5">
                    <p className="font-heading text-lg font-bold text-charcoal">{bucket.currency}</p>
                    <dl className="mt-3 space-y-2 text-sm text-slate">
                      <div className="flex justify-between gap-3">
                        <dt>Брутто</dt>
                        <dd>{formatLedgerAmount(bucket.grossTotal, bucket.currency)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Заработано</dt>
                        <dd>{formatLedgerAmount(bucket.earnedNet, bucket.currency)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Комиссия</dt>
                        <dd>{formatLedgerAmount(bucket.commissionTotal, bucket.currency)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Ожидает</dt>
                        <dd>{formatLedgerAmount(bucket.pendingPayout, bucket.currency)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Выплачено</dt>
                        <dd>{formatLedgerAmount(bucket.paidOut, bucket.currency)}</dd>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-gray-100 pt-2 font-semibold text-charcoal">
                        <dt>Доступно</dt>
                        <dd>{formatLedgerAmount(bucket.availableBalance, bucket.currency)}</dd>
                      </div>
                    </dl>
                  </Card>
                ))}
              </div>
              {summary.invalidRecordCount > 0 ? (
                <p className="text-sm text-error">
                  Не включено некорректных финансовых записей: {summary.invalidRecordCount}.
                </p>
              ) : null}
            </div>
          ) : loading ? (
            <p className="text-sm text-slate">Загрузка…</p>
          ) : null}

          {payouts.length > 0 ? (
            <Card variant="cabinet" className="p-4 sm:p-6">
              <h2 className="font-heading text-base font-bold text-charcoal">Пакеты выплат</h2>
              <CabinetTableWrap className="mt-4">
                <Table className="min-w-[560px]">
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
                          {formatLedgerAmount(row.amount, row.currency)}
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
                <Table className="min-w-[720px]">
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
                          {formatLedgerAmount(row.grossAmount, row.currency)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate">
                          {formatLedgerAmount(row.commissionAmount, row.currency)}
                          {row.commissionPercent != null ? (
                            <span className="text-xs"> ({row.commissionPercent}%)</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatLedgerAmount(row.organizerNetAmount, row.currency)}
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
