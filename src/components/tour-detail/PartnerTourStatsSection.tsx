"use client";

import { Baby, Clock3, Languages, UserRound, Users } from "lucide-react";
import type { TourDetail } from "@/types";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { formatDays } from "@/lib/pluralize";
import {
  formatPartnerLanguageSummary,
  formatPartnerMaxGroupLabel,
  resolvePartnerAgeChipMeta,
} from "@/lib/tripster/partner-tour-labels";
import { isYouTravelPartnerDetail } from "@/lib/youtravel/partner-tour-utils";
import { cn } from "@/lib/cn";
import YouTravelTourDetailsSection from "./YouTravelTourDetailsSection";

function MetaChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-charcoal">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {label}
      </div>
      <p className="text-sm leading-relaxed text-slate">{value}</p>
    </div>
  );
}

/** Краткие параметры тура — Tripster-чипы или блок «Детали тура» для YouTravel. */
export default function PartnerTourStatsSection({
  tour,
  content,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
}) {
  if (isYouTravelPartnerDetail(tour)) {
    return <YouTravelTourDetailsSection tour={tour} content={content} />;
  }

  const ageChip = resolvePartnerAgeChipMeta(content);

  const chips: Array<{ icon: typeof Users; label: string; value: string }> = [
    {
      icon: Users,
      label: "Группа",
      value: formatPartnerMaxGroupLabel(tour.groupMax),
    },
    {
      icon: Clock3,
      label: "Длительность",
      value: formatDays(tour.durationDays),
    },
    {
      icon: ageChip.kind === "age" ? UserRound : Baby,
      label: ageChip.label,
      value: ageChip.value,
    },
    {
      icon: Languages,
      label: "Язык",
      value: formatPartnerLanguageSummary(content.languages),
    },
  ];

  return (
    <section aria-label="Параметры тура">
      <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4")}>
        {chips.map((chip) => (
          <MetaChip key={chip.label} icon={chip.icon} label={chip.label} value={chip.value} />
        ))}
      </div>
    </section>
  );
}
