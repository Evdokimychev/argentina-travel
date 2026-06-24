"use client";

import Image from "next/image";
import { useState } from "react";
import AccommodationsSection from "./AccommodationsSection";
import YouTravelAccommodationSection from "./YouTravelAccommodationSection";
import TourSection from "./TourSection";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import type { TourAccommodation, TourDetail } from "@/types";
import {
  hasYouTravelAccommodationContent,
} from "@/lib/youtravel/partner-tour-accommodation";
import { isYouTravelPartnerDetail } from "@/lib/youtravel/partner-tour-utils";
import { resolveTourComfortLevel } from "@/lib/tour-accommodation";
import { tourDetailCardBorderClass } from "@/lib/tour-detail-ui";
import { cn } from "@/lib/cn";

function PartnerAccommodationAccordion({
  items,
}: {
  items: NonNullable<PartnerTourContent["accommodationItems"]>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(items.length ? 0 : null);

  return (
    <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-surface-muted/30">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const images = item.html.match(/<img[^>]+src=["']([^"']+)["']/gi) ?? [];
        const imageUrls = images
          .map((tag) => tag.match(/src=["']([^"']+)["']/i)?.[1])
          .filter(Boolean) as string[];

        return (
          <div key={`${item.title}-${index}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-charcoal">{item.title}</span>
              <svg
                className={cn("h-5 w-5 shrink-0 text-slate transition-transform", isOpen && "rotate-180")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen ? (
              <div className="space-y-4 px-5 pb-5">
                {imageUrls.length ? (
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((url) => (
                      <div
                        key={url}
                        className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-100"
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                  </div>
                ) : null}
                <div
                  className="rich-text-editor-content text-sm leading-relaxed text-slate"
                  dangerouslySetInnerHTML={{ __html: item.html }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function PartnerTourAccommodationSection({
  tour,
  content,
  accommodations,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
  accommodations: TourAccommodation[];
}) {
  const intro = content.accommodationIntroHtml?.trim();
  const items = content.accommodationItems ?? [];
  const fallbackHtml = content.accommodationHtml?.trim();

  if (isYouTravelPartnerDetail(tour) && (accommodations.length > 0 || hasYouTravelAccommodationContent(content))) {
    return (
      <YouTravelAccommodationSection
        tour={tour}
        content={content}
        accommodations={accommodations}
      />
    );
  }

  if (accommodations.length > 0) {
    const comfortDescription =
      content.comfortDescription?.trim() ||
      intro ||
      tour.descriptionExtra?.comfort?.trim();

    return (
      <AccommodationsSection
        accommodations={accommodations}
        durationNights={tour.durationNights}
        comfortLevel={resolveTourComfortLevel(tour)}
        comfortDescriptionHtml={comfortDescription ? `<p>${comfortDescription}</p>` : undefined}
        comfortLevelLabel={content.comfortLabel}
        comfortDotCount={content.comfortLevel}
        hideComfortHelpPopover={Boolean(content.comfortLabel)}
      />
    );
  }

  if (!intro && !items.length && !fallbackHtml) return null;

  return (
    <TourSection id="accommodations" title="Проживание">
      {intro ? (
        <div
          className="rich-text-editor-content mb-5 space-y-4 leading-relaxed text-charcoal/90"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
      ) : null}

      {items.length ? <PartnerAccommodationAccordion items={items} /> : null}

      {fallbackHtml ? (
        <div
          className={cn(
            "rich-text-editor-content leading-relaxed text-charcoal/90",
            (intro || items.length) && "mt-5"
          )}
          dangerouslySetInnerHTML={{ __html: fallbackHtml }}
        />
      ) : null}
    </TourSection>
  );
}
