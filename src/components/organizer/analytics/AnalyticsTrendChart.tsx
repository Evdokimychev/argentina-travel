"use client";

import { cn } from "@/lib/cn";
import type { AnalyticsDailyPoint } from "@/types/organizer-analytics";

interface AnalyticsTrendChartProps {
  points: AnalyticsDailyPoint[];
  formatValue?: (value: number) => string;
  className?: string;
  accentClassName?: string;
}

export default function AnalyticsTrendChart({
  points,
  formatValue = (value) => String(value),
  className,
  accentClassName = "from-sky/80 to-sky/30",
}: AnalyticsTrendChartProps) {
  if (points.length === 0) {
    return <p className="text-sm text-slate">Нет данных за выбранный период.</p>;
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end gap-1 sm:gap-1.5" style={{ minHeight: "8rem" }}>
        {points.map((point) => {
          const heightPct = point.value > 0 ? Math.max((point.value / max) * 100, 8) : 0;
          return (
            <div
              key={point.date}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              title={`${point.label}: ${formatValue(point.value)}`}
            >
              <div
                className={cn(
                  "w-full max-w-[2rem] rounded-t-md bg-gradient-to-t transition-all",
                  accentClassName,
                  point.value === 0 && "opacity-20"
                )}
                style={{ height: `${heightPct}%` }}
              />
              <span className="hidden text-[10px] text-slate sm:block">{point.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate">
        Итого за период: <span className="font-semibold text-charcoal">{formatValue(total)}</span>
      </p>
    </div>
  );
}
