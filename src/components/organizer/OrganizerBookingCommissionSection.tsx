"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FormattedPrice from "@/components/FormattedPrice";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { apiFetchOrganizerBookingCommission, isRemoteBookingsMode } from "@/lib/bookings-api";
import type {
  BookingCommissionSnapshotRow,
  PlatformCommissionRuleRow,
} from "@/types/platform-commission";

function formatRuleSnapshot(rule: PlatformCommissionRuleRow | null): string {
  if (!rule) return "Правило не найдено";
  if (rule.ruleType === "fixed" && rule.fixedAmount != null) {
    return `${rule.name} · фикс. ${rule.fixedAmount} ${rule.fixedCurrency}`;
  }
  if (rule.percentValue != null) {
    return `${rule.name} · ${rule.percentValue}%`;
  }
  return rule.name;
}

export default function OrganizerBookingCommissionSection({ bookingId }: { bookingId: string }) {
  const [snapshots, setSnapshots] = useState<BookingCommissionSnapshotRow[]>([]);
  const [rule, setRule] = useState<PlatformCommissionRuleRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRemoteBookingsMode()) return;

    setLoading(true);
    void apiFetchOrganizerBookingCommission(bookingId)
      .then((payload) => {
        setSnapshots(payload.snapshots);
        setRule(payload.rule);
        setError(null);
      })
      .catch((cause) => {
        setSnapshots([]);
        setRule(null);
        setError(cause instanceof Error ? cause.message : "Не удалось загрузить начисления");
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (!isRemoteBookingsMode()) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-slate">
        Загрузка начислений…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-950">
        {error}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-sm text-slate">
        Начисления появятся после успешной оплаты туриста.{" "}
        <Link href="/organizer/finance" className="font-medium text-brand hover:underline">
          Открыть финансы
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div>
        <h3 className="font-heading text-base font-bold text-charcoal">Начисление по оплате</h3>
        <p className="mt-1 text-sm text-slate">
          Снимок комиссии платформы на момент списания · {formatRuleSnapshot(rule)}
        </p>
      </div>

      <div className="space-y-3">
        {snapshots.map((row) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <p className="text-xs text-slate">Брутто</p>
              <FormattedPrice priceUsd={row.grossAmount} className="mt-0.5 font-semibold" />
            </div>
            <div>
              <p className="text-xs text-slate">Комиссия платформы</p>
              <FormattedPrice priceUsd={row.commissionAmount} className="mt-0.5 font-semibold text-slate" />
              {row.commissionPercent != null ? (
                <p className="text-xs text-slate">{row.commissionPercent}%</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs text-slate">Ваш доход</p>
              <FormattedPrice
                priceUsd={row.organizerNetAmount}
                className="mt-0.5 font-semibold text-emerald-800"
              />
            </div>
            <div>
              <p className="text-xs text-slate">Дата начисления</p>
              <p className="mt-0.5 text-sm font-medium text-charcoal">
                {formatBookingCreatedAt(row.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
