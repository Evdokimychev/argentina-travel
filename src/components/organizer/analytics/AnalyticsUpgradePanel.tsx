"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

interface AnalyticsUpgradePanelProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function AnalyticsUpgradePanel({
  title = "Расширенная аналитика",
  description = "Подключите тариф «Профи» или «Агентство», чтобы видеть динамику, сегменты, клиентов и эффективность приватных туров.",
  className,
}: AnalyticsUpgradePanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-sky/5 p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-100/60 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Тариф «Стартовый»
          </div>
          <h3 className="font-heading text-xl font-bold text-charcoal">{title}</h3>
          <p className="text-sm leading-relaxed text-slate">{description}</p>
          <ul className="mt-2 space-y-1 text-sm text-charcoal">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
              Динамика бронирований и выручки по дням и месяцам
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
              Рейтинг туров, регионов и форматов (публичные / приватные)
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
              Клиенты, повторные бронирования и средний чек (AOV)
            </li>
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Link
            href="/join"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-sky px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
          >
            Узнать о тарифах
          </Link>
          <Link
            href="/contacts"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-gray-50"
          >
            Связаться с нами
          </Link>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsLockedSectionProps {
  children: React.ReactNode;
  locked: boolean;
  className?: string;
}

export function AnalyticsLockedSection({
  children,
  locked,
  className,
}: AnalyticsLockedSectionProps) {
  if (!locked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none blur-[2px] opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/55 p-4 backdrop-blur-[1px]">
        <div className="max-w-sm rounded-2xl border border-violet-200 bg-white/95 px-4 py-3 text-center shadow-lg">
          <Lock className="mx-auto h-5 w-5 text-violet-700" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-charcoal">Доступно на тарифе «Профи»</p>
          <p className="mt-1 text-xs text-slate">Подключите расширенную аналитику для детальных отчётов.</p>
        </div>
      </div>
    </div>
  );
}
