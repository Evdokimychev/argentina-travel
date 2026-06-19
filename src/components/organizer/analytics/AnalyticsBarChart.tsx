"use client";

import { cn } from "@/lib/cn";

export interface AnalyticsBarChartItem {
  label: string;
  value: number;
  hint?: string;
}

interface AnalyticsBarChartProps {
  items: AnalyticsBarChartItem[];
  formatValue?: (value: number) => string;
  barClassName?: string;
  className?: string;
}

export default function AnalyticsBarChart({
  items,
  formatValue = (value) => String(value),
  barClassName = "bg-sky",
  className,
}: AnalyticsBarChartProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <p className="text-sm text-slate">Нет данных за выбранный период.</p>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-charcoal">{item.label}</p>
            {item.hint ? <p className="truncate text-[11px] text-slate">{item.hint}</p> : null}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn("h-full rounded-full transition-all", barClassName)}
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-charcoal">
            {formatValue(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
