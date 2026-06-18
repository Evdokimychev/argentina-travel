"use client";

import { BedDouble, Clock3, MapPin, Route, Users, UsersRound } from "lucide-react";
import type { TourDetail } from "@/types";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { formatDurationShort } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { formatTouristsRange } from "@/lib/pluralize";
import {
  formatPartnerFormatLabel,
  formatPartnerMovementLabel,
} from "@/lib/tripster/partner-tour-labels";
import { cn } from "@/lib/cn";

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

export default function PartnerTourStatsSection({
  tour,
  content,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
}) {
  const chips: Array<{ icon: typeof Users; label: string; value: string }> = [];

  chips.push({
    icon: Clock3,
    label: "Длительность",
    value: formatDurationShort(tour.durationDays, tour.durationNights),
  });

  chips.push({
    icon: Users,
    label: "Размер группы",
    value: `${formatTouristsRange(tour.groupMin, tour.groupMax)} · ${formatMinimumAgeSummary(tour.minimumAge)}`,
  });

  const formatLabel = formatPartnerFormatLabel(content.format);
  if (formatLabel) {
    chips.push({
      icon: Route,
      label: "Формат",
      value: formatLabel,
    });
  }

  const movementLabel = formatPartnerMovementLabel(content.movementType);
  if (movementLabel) {
    chips.push({
      icon: MapPin,
      label: "Передвижение",
      value: movementLabel,
    });
  }

  if (content.visitorsCount && content.visitorsCount > 0) {
    chips.push({
      icon: UsersRound,
      label: "Путешественники",
      value: `Уже путешествовали ${content.visitorsCount.toLocaleString("ru-RU")} человек`,
    });
  }

  if (content.comfortHtml) {
    chips.push({
      icon: BedDouble,
      label: "Комфорт и питание",
      value: "Смотрите блок «Проживание и комфорт» ниже",
    });
  }

  if (chips.length === 0) return null;

  return (
    <section aria-label="Параметры тура">
      <div className={cn("grid gap-3", chips.length >= 3 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2")}>
        {chips.map((chip) => (
          <MetaChip key={chip.label} icon={chip.icon} label={chip.label} value={chip.value} />
        ))}
      </div>
    </section>
  );
}
