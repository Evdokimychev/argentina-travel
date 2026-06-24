"use client";

import { ArrowRight } from "lucide-react";
import TourFlightBriefingBlocks from "@/components/tour-detail/TourFlightBriefingBlocks";
import type { TourFlightBriefing } from "@/lib/flights/tour-flight-prefill";
import { cn } from "@/lib/cn";

function MinimalTourRouteStrip({ briefing }: { briefing: TourFlightBriefing }) {
  const { outbound, return: returnAdvice } = briefing.recommendations;

  if (!outbound && !returnAdvice) {
    return (
      <p className="text-[11px] leading-snug text-slate/90 sm:text-xs">
        {briefing.recommendations.summary}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate sm:text-xs">
      {outbound ? (
        <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-white/75 px-1.5 py-0.5 shadow-sm">
          <span className="shrink-0 font-semibold uppercase tracking-wide text-[10px] text-emerald-700">
            Старт
          </span>
          <span className="truncate font-medium text-charcoal">{outbound.city}</span>
          {outbound.tourDateLabel ? (
            <span className="hidden shrink-0 sm:inline">{outbound.tourDateLabel}</span>
          ) : null}
        </span>
      ) : null}
      {outbound && returnAdvice ? (
        <ArrowRight className="h-3 w-3 shrink-0 text-slate/50" aria-hidden />
      ) : null}
      {returnAdvice ? (
        <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-white/75 px-1.5 py-0.5 shadow-sm">
          <span className="shrink-0 font-semibold uppercase tracking-wide text-[10px] text-charcoal/70">
            Финиш
          </span>
          <span className="truncate font-medium text-charcoal">{returnAdvice.city}</span>
          {returnAdvice.tourDateLabel ? (
            <span className="hidden shrink-0 sm:inline">{returnAdvice.tourDateLabel}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export default function TourFlightModalTourContext({
  briefing,
  className,
  variant = "default",
}: {
  briefing: TourFlightBriefing;
  className?: string;
  variant?: "default" | "compact" | "minimal";
}) {
  const dense = variant === "compact";

  if (variant === "minimal") {
    return (
      <div className={cn("min-w-0", className)}>
        <MinimalTourRouteStrip briefing={briefing} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        dense
          ? "rounded-xl border border-sky/15 bg-white/80 px-2 py-2 backdrop-blur-sm sm:px-2.5"
          : "rounded-xl border border-sky/15 bg-sky/[0.04] px-3 py-3 sm:px-4",
        className,
      )}
    >
      <p
        className={cn(
          "font-semibold text-charcoal",
          dense ? "mb-2 text-[10px] uppercase tracking-wide text-charcoal/80" : "mb-3 text-xs",
        )}
      >
        Маршрут тура
      </p>
      <TourFlightBriefingBlocks briefing={briefing} dense={dense} />
      {briefing.routeNote ? (
        <p
          className={cn(
            "mt-2 leading-relaxed text-slate",
            dense ? "text-[11px]" : "text-xs",
          )}
        >
          {briefing.routeNote}
        </p>
      ) : null}
    </div>
  );
}
