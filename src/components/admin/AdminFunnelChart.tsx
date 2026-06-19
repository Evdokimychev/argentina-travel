"use client";

import { cn } from "@/lib/cn";
import type { AnalyticsFunnelStep } from "@/types/admin-analytics";

type Props = {
  steps: AnalyticsFunnelStep[];
  className?: string;
};

export default function AdminFunnelChart({ steps, className }: Props) {
  const max = Math.max(1, ...steps.map((step) => step.count));

  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, index) => {
        const widthPct = Math.max(step.count > 0 ? 12 : 4, Math.round((step.count / max) * 100));
        return (
          <div key={step.id} className="relative">
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-charcoal">{step.label}</span>
              <span className="tabular-nums text-charcoal">
                {step.count.toLocaleString("ru-RU")}
              </span>
            </div>
            <div className="h-10 overflow-hidden rounded-xl bg-gray-50">
              <div
                className="flex h-full items-center rounded-xl bg-gradient-to-r from-sky/80 to-sky px-3 text-xs font-medium text-white transition-all"
                style={{ width: `${widthPct}%`, minWidth: step.count > 0 ? "3rem" : "1.5rem" }}
              >
                {step.count > 0 ? step.count.toLocaleString("ru-RU") : ""}
              </div>
            </div>
            {index > 0 ? (
              <p className="mt-1 text-xs text-slate">
                {step.rateFromPrevious != null
                  ? `${step.rateFromPrevious}% от предыдущего шага`
                  : "—"}
                {step.rateFromFirst != null ? ` · ${step.rateFromFirst}% от просмотра` : ""}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
