"use client";

import { cn } from "@/lib/cn";

type Props = {
  title: string;
  points: { date: string; count: number }[];
  className?: string;
};

function formatDayLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}.${month}`;
}

export default function AdminTrendChart({ title, points, className }: Props) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const showLabels = points.length <= 14;

  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-4", className)}>
      <h3 className="text-sm font-medium text-charcoal">{title}</h3>
      <div className="mt-4 flex items-end gap-1" style={{ minHeight: 120 }}>
        {points.map((point) => {
          const heightPct = Math.round((point.count / max) * 100);
          return (
            <div
              key={point.date}
              className="group flex flex-1 flex-col items-center justify-end gap-1"
              title={`${point.date}: ${point.count}`}
            >
              <span className="text-[10px] text-slate opacity-0 transition-opacity group-hover:opacity-100">
                {point.count || ""}
              </span>
              <div
                className="w-full min-w-[4px] max-w-[20px] rounded-t bg-sky/70 transition-colors group-hover:bg-sky"
                style={{ height: `${Math.max(point.count > 0 ? 8 : 2, heightPct)}%` }}
              />
              {showLabels ? (
                <span className="text-[9px] text-slate">{formatDayLabel(point.date)}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
