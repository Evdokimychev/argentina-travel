"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import {
  getTourTravelRiskIcon,
  getTourTravelRiskLabel,
} from "@/data/tour-travel-risk-kinds";
import { getTravelRiskDescription } from "@/lib/tour-travel-risk";
import type { TourTravelRisk } from "@/types/tour-travel-risk";
import { cn } from "@/lib/cn";

interface TourTravelRisksPanelProps {
  risks: TourTravelRisk[];
  className?: string;
  /** Встроенный блок внутри карточки программы (компактный, с раскрытием) */
  variant?: "standalone" | "embedded";
}

function RiskListItem({ risk }: { risk: TourTravelRisk }) {
  const Icon = getTourTravelRiskIcon(risk.kind);
  const label = getTourTravelRiskLabel(risk);
  const description = getTravelRiskDescription(risk);

  return (
    <li className="flex gap-3 rounded-xl border border-amber-100/80 bg-amber-50/50 p-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-800 ring-1 ring-amber-100">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-charcoal">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate">{description}</p>
      </div>
    </li>
  );
}

function EmbeddedTravelRisks({ risks }: { risks: TourTravelRisk[] }) {
  const [expanded, setExpanded] = useState(false);
  const previewLabels = risks.map((risk) => getTourTravelRiskLabel(risk));
  const summary =
    previewLabels.length <= 2
      ? previewLabels.join(" · ")
      : `${previewLabels.slice(0, 2).join(" · ")} · +${previewLabels.length - 2}`;

  return (
    <div className="border-t border-gray-100 pt-5">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 text-left"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <AlertCircle className="h-4 w-4 stroke-[1.75]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-charcoal">На что обратить внимание</span>
            <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[11px] font-medium text-amber-900">
              {risks.length}{" "}
              {risks.length === 1 ? "фактор" : risks.length < 5 ? "фактора" : "факторов"}
            </span>
          </span>
          {!expanded ? (
            <span className="mt-1 block text-sm leading-snug text-slate">{summary}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-slate transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <ul className="mt-4 space-y-2.5 animate-fade-in-up">
          {risks.map((risk) => (
            <RiskListItem key={risk.id} risk={risk} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StandaloneTravelRisks({
  risks,
  className,
}: {
  risks: TourTravelRisk[];
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = risks.slice(0, 2);
  const hiddenCount = Math.max(0, risks.length - preview.length);
  const summaryText =
    hiddenCount > 0
      ? `${getTourTravelRiskLabel(preview[0]!)} и ещё ${hiddenCount} ${hiddenCount === 1 ? "фактор" : hiddenCount < 5 ? "фактора" : "факторов"}`
      : getTourTravelRiskLabel(preview[0]!);

  return (
    <section aria-label="Факторы маршрута" className={cn("mt-3 sm:mt-4", className)}>
      <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex w-full items-start gap-3 text-left"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertCircle className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-charcoal">На что обратить внимание</p>
            {!expanded ? (
              <p className="mt-1 text-sm text-slate">{summaryText}</p>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "mt-1 h-5 w-5 shrink-0 text-slate transition-transform",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {expanded ? (
          <ul className="mt-4 space-y-2.5 animate-fade-in-up">
            {risks.map((risk) => (
              <RiskListItem key={risk.id} risk={risk} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export default function TourTravelRisksPanel({
  risks,
  className,
  variant = "standalone",
}: TourTravelRisksPanelProps) {
  if (!risks.length) return null;

  if (variant === "embedded") {
    return (
      <div className={className}>
        <EmbeddedTravelRisks risks={risks} />
      </div>
    );
  }

  return <StandaloneTravelRisks risks={risks} className={className} />;
}
