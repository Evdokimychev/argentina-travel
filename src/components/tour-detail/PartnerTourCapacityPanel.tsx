"use client";

import { cn } from "@/lib/cn";
import type { PartnerDepartureCapacity } from "@/lib/partner-tour/departure-capacity";
import { formatPartnerDepartureOccupancySummary } from "@/lib/partner-tour/departure-capacity";

function CapacityStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "booked" | "free";
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 text-center shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums text-charcoal",
          tone === "booked" && "text-sky",
          tone === "free" && "text-success",
        )}
      >
        {value.toLocaleString("ru-RU")}
      </p>
    </div>
  );
}

export default function PartnerTourCapacityPanel({
  capacity,
}: {
  capacity: PartnerDepartureCapacity;
}) {
  const fillPercent = capacity.total > 0 ? Math.round((capacity.booked / capacity.total) * 100) : 0;

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <CapacityStat label="В группе" value={capacity.total} />
        <CapacityStat label="Уже едут" value={capacity.booked} tone="booked" />
        <CapacityStat label="Свободно" value={capacity.free} tone="free" />
      </div>

      <div className="space-y-1.5">
        <div
          className="h-2 overflow-hidden rounded-full bg-white/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={capacity.total}
          aria-valuenow={capacity.booked}
          aria-label="Заполненность группы"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky to-sky/70 transition-[width] duration-300"
            style={{ width: `${Math.min(Math.max(fillPercent, 0), 100)}%` }}
          />
        </div>
        <p className="text-sm leading-snug text-slate">
          {formatPartnerDepartureOccupancySummary(capacity)}
        </p>
      </div>
    </div>
  );
}
