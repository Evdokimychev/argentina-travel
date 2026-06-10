"use client";

import { useState } from "react";
import { Mountain, BedDouble, Users, Sun, type LucideIcon } from "lucide-react";
import { TourDetail } from "@/types";
import {
  DIFFICULTY_LEVELS,
  COMFORT_DOT_COUNT,
  COMFORT_INFO_ITEMS,
  DIFFICULTY_DOT_COUNT,
} from "@/data/tour-levels";
import {
  NO_ACCOMMODATION_LABEL,
  resolveTourComfortLevel,
  tourHasAccommodation,
} from "@/lib/tour-accommodation";
import InfoModal, { HelpButton } from "./InfoModal";
import { cn } from "@/lib/cn";
import { formatTouristsRange } from "@/lib/pluralize";
import { formatAgeRangeSummary, formatMaxWeightSummary } from "@/lib/tour-age";
import type { TourLanguage } from "@/types";

interface TourStatsSectionProps {
  tour: TourDetail;
  difficultyDescription?: string;
  maximumAge?: number | null;
  maxWeightEnabled?: boolean;
  maxWeightKg?: number | null;
  languages?: TourLanguage[];
}

function DotRating({
  filled,
  total = 5,
  variant,
}: {
  filled: number;
  total?: number;
  variant: "difficulty" | "comfort";
}) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < filled
              ? variant === "difficulty"
                ? i >= 4
                  ? "bg-red-500"
                  : "bg-brand"
                : "bg-emerald-500"
              : "bg-gray-200"
          )}
        />
      ))}
    </span>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  const id = href.replace("#", "");
  return (
    <button
      type="button"
      onClick={() => scrollToSection(id)}
      className="mt-3 self-start text-left text-sm font-medium text-brand transition-colors hover:text-brand/80"
    >
      {children}
    </button>
  );
}

function StatColumn({
  icon: Icon,
  title,
  helpOnClick,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  helpOnClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-4 sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-charcoal">
          <Icon className="h-[18px] w-[18px] stroke-[1.75]" />
        </span>
        <p className="flex items-center text-sm font-medium text-charcoal">
          {title}
          {helpOnClick && <HelpButton onClick={helpOnClick} />}
        </p>
      </div>
      {children}
    </div>
  );
}

export default function TourStatsSection({
  tour,
  difficultyDescription,
  maximumAge,
  maxWeightEnabled,
  maxWeightKg,
  languages = [],
}: TourStatsSectionProps) {
  const [modal, setModal] = useState<"difficulty" | "comfort" | null>(null);

  const hasAccommodation = tourHasAccommodation(tour);
  const comfortLevel = resolveTourComfortLevel(tour);
  const difficultyDots = DIFFICULTY_DOT_COUNT[tour.difficulty] ?? 3;
  const comfortDots = COMFORT_DOT_COUNT[comfortLevel] ?? 0;

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatColumn
          icon={Mountain}
          title="Сложность"
          helpOnClick={() => setModal("difficulty")}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm text-slate">{tour.difficulty}</span>
            <DotRating filled={difficultyDots} variant="difficulty" />
          </div>
          {difficultyDescription?.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-slate">{difficultyDescription}</p>
          ) : null}
          <SectionLink href="#route-map">К маршруту</SectionLink>
        </StatColumn>

        <StatColumn
          icon={hasAccommodation ? BedDouble : Sun}
          title="Уровень комфорта"
          helpOnClick={() => setModal("comfort")}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm text-slate">{comfortLevel}</span>
            <DotRating filled={comfortDots} variant="comfort" />
          </div>
          {hasAccommodation ? (
            <SectionLink href="#accommodations">К проживанию</SectionLink>
          ) : null}
        </StatColumn>

        <StatColumn icon={Users} title="Размер группы">
          <p className="text-sm text-slate">
            {formatTouristsRange(tour.groupMin, tour.groupMax)}
          </p>
          <p className="mt-1 text-xs text-slate/80">
            {formatAgeRangeSummary(tour.minimumAge, maximumAge)}
          </p>
          {formatMaxWeightSummary(maxWeightEnabled, maxWeightKg) ? (
            <p className="mt-1 text-xs text-slate/80">
              {formatMaxWeightSummary(maxWeightEnabled, maxWeightKg)}
            </p>
          ) : null}
          {languages.length > 0 ? (
            <p className="mt-1 text-xs text-slate/80">Языки: {languages.join(", ")}</p>
          ) : null}
        </StatColumn>
      </div>

      <InfoModal
        open={modal === "difficulty"}
        onClose={() => setModal(null)}
        title="Уровни сложности"
        variant="difficulty"
        highlightLevel={tour.difficulty}
        items={DIFFICULTY_LEVELS.map((l) => ({
          level: l.level,
          description: l.description,
          scale: DIFFICULTY_DOT_COUNT[l.level],
        }))}
      />
      <InfoModal
        open={modal === "comfort"}
        onClose={() => setModal(null)}
        title="Уровень комфорта"
        variant="comfort"
        highlightLevel={comfortLevel}
        items={COMFORT_INFO_ITEMS}
        hint={
          comfortLevel === NO_ACCOMMODATION_LABEL
            ? "Подходит для однодневных экскурсий и туров без ночёвки."
            : undefined
        }
      />
    </section>
  );
}
