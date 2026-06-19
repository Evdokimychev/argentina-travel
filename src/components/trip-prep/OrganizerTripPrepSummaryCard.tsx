"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  apiFetchOrganizerTripPrepSummary,
  isRemoteTripPrepMode,
} from "@/lib/trip-prep-api";
import type { OrganizerTripPrepSummary } from "@/types/trip-prep";

interface OrganizerTripPrepSummaryCardProps {
  bookingId: string;
  className?: string;
}

export default function OrganizerTripPrepSummaryCard({
  bookingId,
  className,
}: OrganizerTripPrepSummaryCardProps) {
  const [summary, setSummary] = useState<OrganizerTripPrepSummary | null>(null);
  const [loading, setLoading] = useState(isRemoteTripPrepMode());

  useEffect(() => {
    if (!isRemoteTripPrepMode()) {
      setLoading(false);
      return;
    }

    void apiFetchOrganizerTripPrepSummary(bookingId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (!isRemoteTripPrepMode()) return null;
  if (loading) {
    return (
      <div className={cn("rounded-xl bg-gray-50 px-4 py-3 text-sm text-slate ring-1 ring-gray-200", className)}>
        Загрузка данных о подготовке…
      </div>
    );
  }
  if (!summary || summary.itemsTotal === 0) return null;

  return (
    <div className={cn("rounded-xl bg-sky-50/60 px-4 py-3 ring-1 ring-sky-100", className)}>
      <div className="flex items-start gap-3">
        <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal">Подготовка туриста</p>
          <p className="mt-1 text-sm text-slate">
            {summary.hasProgress
              ? `Турист выполнил ${summary.percentComplete}% чек-листа (${summary.itemsChecked} из ${summary.itemsTotal}).`
              : "Турист ещё не отметил пункты чек-листа подготовки."}
          </p>
          {summary.isComplete ? (
            <p className="mt-1 text-xs font-medium text-emerald-700">
              Обязательные пункты выполнены.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface OrganizerTripPrepSummaryInlineProps {
  bookingId: string;
}

export function OrganizerTripPrepSummaryInline({ bookingId }: OrganizerTripPrepSummaryInlineProps) {
  return <OrganizerTripPrepSummaryCard bookingId={bookingId} />;
}
