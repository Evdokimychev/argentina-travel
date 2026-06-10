"use client";

import { useMemo, useState } from "react";
import {
  BedDouble,
  Globe,
  Mountain,
  Scale,
  Sun,
  Tag,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { TourDetail, type TourBookingMode } from "@/types";
import {
  DIFFICULTY_LEVELS,
  COMFORT_DOT_COUNT,
  COMFORT_INFO_ITEMS,
  DIFFICULTY_DOT_COUNT,
} from "@/data/tour-levels";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";
import {
  NO_ACCOMMODATION_LABEL,
  resolveTourComfortLevel,
  tourHasAccommodation,
} from "@/lib/tour-accommodation";
import InfoModal, { HelpButton } from "./InfoModal";
import { cn } from "@/lib/cn";
import { formatTouristsRange } from "@/lib/pluralize";
import { formatAgeRangeSummary, formatMaxWeightSummary } from "@/lib/tour-age";
import { filterTourDisplayTags } from "@/lib/tour-public-display";
import type { TourLanguage } from "@/types";

interface TourStatsSectionProps {
  tour: TourDetail;
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
  scrollToSiteAnchor(id);
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
        "flex flex-col items-start rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-4 sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
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

function formatTourFormatLabel(mode?: TourBookingMode): string | null {
  switch (mode ?? "scheduled") {
    case "scheduled":
      return "Групповой тур";
    case "on_request":
      return "Индивидуальный тур";
    case "both":
      return "Групповой или индивидуально";
    default:
      return null;
  }
}

type MetaItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function TourStatsMeta({ items }: { items: MetaItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2 sm:mt-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li
            key={item.label}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200/80 bg-white/90 px-3 py-1.5 text-xs leading-snug text-charcoal shadow-sm"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-sky/80" aria-hidden />
            <span className="text-slate/90">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function TourStatsSection({
  tour,
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
  const hasDifficultyDetails = Boolean(tour.descriptionExtra?.difficulty.trim());

  const ageSummary = formatAgeRangeSummary(tour.minimumAge, maximumAge);
  const weightSummary = formatMaxWeightSummary(maxWeightEnabled, maxWeightKg);
  const formatLabel = formatTourFormatLabel(tour.bookingMode);

  const metaItems = useMemo(() => {
    const items: MetaItem[] = [];

    if (weightSummary) {
      items.push({ icon: Scale, label: "Участники", value: weightSummary });
    }

    if (languages.length > 0) {
      items.push({ icon: Globe, label: "Языки", value: languages.join(", ") });
    }

    if (formatLabel) {
      items.push({ icon: UsersRound, label: "Формат", value: formatLabel });
    }

    if (tour.accommodationType?.trim()) {
      items.push({
        icon: BedDouble,
        label: "Проживание",
        value: tour.accommodationType.trim(),
      });
    }

    const visibleTags = filterTourDisplayTags(tour.tags ?? []);
    if (visibleTags.length > 0) {
      items.push({ icon: Tag, label: "Тип", value: visibleTags.join(", ") });
    }

    return items;
  }, [
    weightSummary,
    languages,
    formatLabel,
    tour.accommodationType,
    tour.tags,
  ]);

  return (
    <section aria-label="Параметры тура">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatColumn
          icon={Mountain}
          title="Сложность"
          helpOnClick={() => setModal("difficulty")}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm text-slate">{tour.difficulty}</span>
            <DotRating filled={difficultyDots} variant="difficulty" />
          </div>
          {hasDifficultyDetails ? (
            <SectionLink href="#description">Подробнее о сложности</SectionLink>
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
          <p className="text-sm font-medium text-charcoal">
            {formatTouristsRange(tour.groupMin, tour.groupMax)}
          </p>
          <p className="mt-1.5 text-xs text-slate">{ageSummary}</p>
        </StatColumn>
      </div>

      <TourStatsMeta items={metaItems} />

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
