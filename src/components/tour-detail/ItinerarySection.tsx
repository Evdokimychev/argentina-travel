"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { TourItineraryDay, TourRoutePoint } from "@/types";
import TourSection from "./TourSection";
import TourSectionExpandToggle from "./TourSectionExpandToggle";
import { SafeImage } from "@/components/ui/safe-image";
import { buildSupabaseCdnUrl } from "@/lib/media/cdn-url";
import { cn } from "@/lib/cn";
import { formatOpenedDaysLabel, formatDaysOpenOfTotal } from "@/lib/pluralize";
import {
  tourDetailCardBorderClass,
  tourDetailDayBadgeClass,
  tourDetailTimelineClass,
} from "@/lib/tour-detail-ui";
import ItineraryDayDetails from "./ItineraryDayDetails";
import ItineraryProgramFooter, {
  type ItineraryProgramFooterOverrides,
} from "./ItineraryProgramFooter";
import type { TourDetail } from "@/types";
import { getTourSectionOrganizerComment } from "@/lib/tour-detail-section-comments";
import { getRoutePointsForDay } from "@/lib/tour-itinerary-map";

export type { ItineraryProgramFooterOverrides };

const ItineraryDayMiniMap = dynamic(() => import("./ItineraryDayMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="h-36 animate-pulse rounded-xl bg-gray-100" aria-hidden />
  ),
});

const TourItineraryPdfButton = dynamic(() => import("./TourItineraryPdfButton"), {
  ssr: false,
  loading: () => null,
});

function ItineraryDayCard({
  day,
  isOpen,
  onToggle,
  routePoints,
}: {
  day: TourItineraryDay;
  isOpen: boolean;
  onToggle: () => void;
  routePoints?: TourRoutePoint[];
}) {
  const images = day.images ?? [];
  const activities = day.activities ?? [];
  const meals = day.meals ?? [];
  const dayMapPoints = getRoutePointsForDay(routePoints, day.dayNumber);

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
          {day.routeLocationNames?.length ? (
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate/70" strokeWidth={1.75} aria-hidden />
              {day.routeLocationNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex max-w-full rounded-full bg-gray-50/90 px-2 py-0.5 text-xs leading-snug text-slate ring-1 ring-gray-100/90"
                >
                  <span className="truncate">{name}</span>
                </span>
              ))}
            </div>
          ) : null}
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
              {dayMapPoints.length > 0 ? (
                <ItineraryDayMiniMap
                  points={dayMapPoints}
                  dayNumber={day.dayNumber}
                  className="mt-1"
                />
              ) : null}
              {images.length > 0 && (
                <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
                  {images.map((img, imageIndex) => (
                    <div
                      key={`${img}-${imageIndex}`}
                      className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-100"
                    >
                      <SafeImage
                        src={buildSupabaseCdnUrl(img, { width: 480, quality: 78 })}
                        alt=""
                        fill
                        placeholderVariant="tour"
                        className="object-cover"
                        sizes="144px"
                      />
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
  programFooter?: ItineraryProgramFooterOverrides;
}

export default function ItinerarySection({
  days,
  tour,
  showPdfDownload = true,
  hideProgramFooter = false,
  programFooter,
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
          <TourSectionExpandToggle
            allExpanded={allExpanded}
            openCount={openCount}
            totalCount={totalDays}
            openSegments={openSegments}
            onToggle={handleExpandAll}
            groupAriaLabel={
              allExpanded ? "Свернуть все дни программы" : "Раскрыть все дни программы"
            }
            segmentsTitle={formatDaysOpenOfTotal(openCount, totalDays)}
            statusLabel={formatOpenedDaysLabel(openCount, allExpanded)}
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
            routePoints={tour?.routePoints}
          />
        ))}
      </div>

      {tour && !hideProgramFooter ? (
        <ItineraryProgramFooter
          difficulty={programFooter?.difficulty ?? tour.difficulty}
          difficultyDescriptionHtml={
            programFooter?.difficultyDescriptionHtml ?? tour.descriptionExtra?.difficulty
          }
          organizerComment={
            programFooter?.organizerComment ??
            getTourSectionOrganizerComment(tour, "itinerary")
          }
          organizerCommentLabel={programFooter?.organizerCommentLabel}
          travelRisks={tour.travelRisks}
          sectionLabel={programFooter?.sectionLabel}
          levelLabel={programFooter?.levelLabel}
          levelDescription={programFooter?.levelDescription}
          dotCount={programFooter?.dotCount}
          hideHelpPopover={programFooter?.hideHelpPopover}
        />
      ) : null}
    </TourSection>
  );
}
