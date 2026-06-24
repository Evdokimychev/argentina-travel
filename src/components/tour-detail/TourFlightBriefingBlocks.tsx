"use client";

import { Calendar, PlaneLanding, PlaneTakeoff, Ticket } from "lucide-react";
import type { TourFlightBriefing, TourFlightLegAdvice } from "@/lib/flights/tour-flight-prefill";
import { cn } from "@/lib/cn";

function LegAdviceBlock({
  advice,
  tone,
  dense = false,
}: {
  advice: TourFlightLegAdvice;
  tone: "start" | "finish";
  dense?: boolean;
}) {
  const Icon = tone === "start" ? PlaneLanding : PlaneTakeoff;
  const title = tone === "start" ? "Старт тура" : "Финиш тура";

  return (
    <article
      className={cn(
        "min-w-0 rounded-xl border",
        dense ? "p-2.5 sm:p-3" : "p-3 sm:p-4",
        tone === "start"
          ? "border-emerald-100/90 bg-gradient-to-br from-emerald-50/70 to-white"
          : "border-gray-200/90 bg-gradient-to-br from-gray-50/80 to-white",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md",
            dense ? "h-6 w-6" : "h-7 w-7",
            tone === "start" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-charcoal",
          )}
        >
          <Icon className={dense ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
        </span>
        <p
          className={cn(
            "font-semibold uppercase tracking-wide text-slate",
            dense ? "text-[10px]" : "text-xs",
          )}
        >
          {title}
        </p>
      </div>

      <p className={cn("mt-2 font-semibold text-charcoal", dense ? "text-sm" : "text-base")}>
        {advice.city}
      </p>

      <div
        className={cn(
          "mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-charcoal/90",
          dense ? "text-xs" : "text-sm",
        )}
      >
        {advice.tourDateLabel ? (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0 text-slate/70" aria-hidden />
            {advice.tourDateLabel}
          </span>
        ) : (
          <span className="text-slate">Дата появится после выбора заезда</span>
        )}
        {advice.tourTimeLabel ? (
          <span className="text-slate">{advice.tourTimeLabel} · местное время</span>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-2.5 space-y-1 border-t pt-2",
          tone === "start" ? "border-emerald-100/80" : "border-gray-200/80",
        )}
      >
        <p
          className={cn(
            "flex items-start gap-1.5 font-medium text-charcoal",
            dense ? "text-xs" : "text-sm",
          )}
        >
          <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" aria-hidden />
          <span>{advice.flightTip}</span>
        </p>
        <p className={cn("leading-relaxed text-slate", dense ? "text-[11px]" : "text-xs")}>
          {advice.reason}
        </p>
      </div>
    </article>
  );
}

export default function TourFlightBriefingBlocks({
  briefing,
  dense = false,
  className,
}: {
  briefing: TourFlightBriefing;
  dense?: boolean;
  className?: string;
}) {
  const { outbound, return: returnAdvice } = briefing.recommendations;

  if (!outbound && !returnAdvice) {
    return (
      <p className={cn("text-xs leading-relaxed text-charcoal/90", className)}>
        {briefing.recommendations.summary}
      </p>
    );
  }

  return (
    <div className={cn("grid gap-2.5 sm:grid-cols-2 sm:gap-3", className)}>
      {outbound ? <LegAdviceBlock advice={outbound} tone="start" dense={dense} /> : null}
      {returnAdvice ? <LegAdviceBlock advice={returnAdvice} tone="finish" dense={dense} /> : null}
    </div>
  );
}
