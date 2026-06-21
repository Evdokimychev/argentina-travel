"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { TourItineraryDay } from "@/types";
import TourSection from "./TourSection";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { formatOpenedDaysLabel, formatDaysOpenOfTotal } from "@/lib/pluralize";
import {
  tourDetailCardBorderClass,
  tourDetailDayBadgeClass,
  tourDetailTimelineClass,
} from "@/lib/tour-detail-ui";
import ItineraryDayDetails from "./ItineraryDayDetails";
import ItineraryProgramFooter from "./ItineraryProgramFooter";
import TourItineraryPdfButton from "./TourItineraryPdfButton";
import type { TourDetail } from "@/types";
import { getTourSectionOrganizerComment } from "@/lib/tour-detail-section-comments";

function ItineraryExpandToggle({
  allExpanded,
  openCount,
  totalDays,
  openSegments,
  onToggle,
}: {
  allExpanded: boolean;
  openCount: number;
  totalDays: number;
  openSegments: boolean[];
  onToggle: () => void;
}) {
  return (
    <div
      role="group"
      aria-label={allExpanded ? "Свернуть все дни программы" : "Раскрыть все дни программы"}
      className="flex max-w-full min-h-[44px] items-center gap-3 rounded-xl border border-sky/15 bg-gradient-to-br from-sky/[0.04] to-white px-3 py-2.5 shadow-sm transition-colors hover:border-sky/30 sm:min-h-0"
    >
      <button
        type="button"
        onClick={onToggle}
        className="min-w-0 flex-1 text-left"
        aria-label={allExpanded ? "Свернуть все дни программы" : "Раскрыть все дни программы"}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-charcoal">
            {allExpanded ? "Свернуть все" : "Раскрыть все"}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-slate">
            {openCount}/{totalDays}
          </span>
        </div>

        <div
          className="mt-2 flex gap-0.5"
          aria-hidden
          title={formatDaysOpenOfTotal(openCount, totalDays)}
        >
          {openSegments.map((isOpen, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                isOpen ? "bg-sky" : "bg-gray-200"
              )}
            />
          ))}
        </div>

        <p className="mt-1.5 text-xs text-slate">{formatOpenedDaysLabel(openCount, allExpanded)}</p>
      </button>

      <Switch checked={allExpanded} onCheckedChange={() => onToggle()} aria-hidden />
    </div>
  );
}

function ItineraryDayCard({
  day,
  isOpen,
  onToggle,
}: {
  day: TourItineraryDay;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const images = day.images ?? [];
  const activities = day.activities ?? [];
  const meals = day.meals ?? [];

  return (
    <div className="relative min-w-0 pb-6 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full min-w-0 items-start gap-4 text-left"
      >
        <span className={cn("relative z-10", tourDetailDayBadgeClass)}>
          {day.dayNumber}
        </span>
        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden p-4 transition-shadow sm:p-5",
            tourDetailCardBorderClass,
            "hover:border-sky/20 hover:shadow-md"
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate/80">
            День {day.dayNumber}
          </p>
          <div className="mt-1 flex min-w-0 items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 break-words text-base font-semibold leading-snug text-charcoal sm:text-lg">
              {day.title}
            </h3>
            <ChevronDown
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0 text-slate transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
          {isOpen && (
            <div className="mt-4 min-w-0 space-y-4 border-t border-gray-100 pt-4 animate-fade-in-up">
              {day.description ? (
                day.descriptionHtml ? (
                  <div
                    className="rich-text-editor-content max-w-full break-words text-sm leading-relaxed text-slate [&_img]:max-w-full [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: day.descriptionHtml }}
                  />
                ) : (
                  <p className="break-words text-sm leading-relaxed text-slate">{day.description}</p>
                )
              ) : null}
              {images.length > 0 && (
                <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                  {images.map((img) => (
                    <div
                      key={img}
                      className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-100"
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="144px" />
                    </div>
                  ))}
                </div>
              )}
              <ItineraryDayDetails
                activities={activities}
                meals={meals}
                accommodation={day.accommodation ?? ""}
              />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

interface ItinerarySectionProps {
  days?: TourItineraryDay[] | null;
  tour?: TourDetail | null;
  showPdfDownload?: boolean;
  hideProgramFooter?: boolean;
}

export default function ItinerarySection({
  days,
  tour,
  showPdfDownload = true,
  hideProgramFooter = false,
}: ItinerarySectionProps) {
  const itineraryDays = useMemo(() => days ?? [], [days]);
  const firstDayId = itineraryDays[0]?.id;

  const [openDays, setOpenDays] = useState<Set<string>>(() =>
    firstDayId ? new Set([firstDayId]) : new Set()
  );

  useEffect(() => {
    if (itineraryDays.length === 0) return;
    setOpenDays((prev) => {
      const validIds = new Set(itineraryDays.map((d) => d.id));
      const filtered = new Set([...prev].filter((id) => validIds.has(id)));
      if (filtered.size > 0) return filtered;
      const id = itineraryDays[0]?.id;
      return id ? new Set([id]) : new Set();
    });
  }, [itineraryDays]);

  const openCount = openDays.size;
  const totalDays = itineraryDays.length;
  const allExpanded = totalDays > 0 && openCount === totalDays;

  const openSegments = useMemo(
    () => itineraryDays.map((day) => openDays.has(day.id)),
    [itineraryDays, openDays]
  );

  if (totalDays === 0) return null;

  function toggleDay(id: string) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleExpandAll() {
    if (allExpanded) {
      setOpenDays(new Set());
    } else {
      setOpenDays(new Set(itineraryDays.map((d) => d.id)));
    }
  }

  return (
    <TourSection
      id="itinerary"
      title="Программа по дням"
      defaultMobileExpanded
      headerAddon={
        totalDays > 1 ? (
          <ItineraryExpandToggle
            allExpanded={allExpanded}
            openCount={openCount}
            totalDays={totalDays}
            openSegments={openSegments}
            onToggle={handleExpandAll}
          />
        ) : undefined
      }
    >
      {showPdfDownload && tour ? <TourItineraryPdfButton tour={tour} className="mb-5 sm:mb-6" /> : null}
      <div className="relative min-w-0 space-y-0 overflow-hidden">
        <div className={cn("absolute left-[19px] top-4 bottom-4 w-0.5 sm:left-[23px]", tourDetailTimelineClass)} />
        {itineraryDays.map((day) => (
          <ItineraryDayCard
            key={day.id}
            day={day}
            isOpen={openDays.has(day.id)}
            onToggle={() => toggleDay(day.id)}
          />
        ))}
      </div>

      {tour && !hideProgramFooter ? (
        <ItineraryProgramFooter
          difficulty={tour.difficulty}
          difficultyDescriptionHtml={tour.descriptionExtra?.difficulty}
          organizerComment={tour ? getTourSectionOrganizerComment(tour, "itinerary") : undefined}
          travelRisks={tour.travelRisks}
        />
      ) : null}
    </TourSection>
  );
}
