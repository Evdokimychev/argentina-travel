"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";
import {
  tourDetailSectionCardClass,
  tourDetailSectionToggleClass,
} from "@/lib/tour-detail-ui";
import TourSectionOrganizerNote from "./TourSectionOrganizerNote";

type TourSectionProps = {
  id: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  bare?: boolean;
  headerAddon?: ReactNode;
  organizerComment?: string;
  collapsibleOnMobile?: boolean;
  defaultMobileExpanded?: boolean;
};

export const tourSectionScrollMtClass = siteScrollAnchorClass;

const TOUR_SECTION_EXPAND_EVENT = "tour-section-expand";

function TourSectionHeader({
  title,
  subtitle,
  headerAddon,
  collapsibleOnMobile,
  mobileExpanded,
  onToggleMobile,
  sectionId,
}: {
  title: string;
  subtitle?: ReactNode;
  headerAddon?: ReactNode;
  collapsibleOnMobile: boolean;
  mobileExpanded: boolean;
  onToggleMobile: () => void;
  sectionId: string;
}) {
  const showSubtitle = subtitle && (!collapsibleOnMobile || mobileExpanded);

  const titleEl = (
    <h2
      id={`${sectionId}-heading`}
      className="font-heading text-xl font-bold text-charcoal sm:text-2xl md:text-3xl"
    >
      {title}
    </h2>
  );

  return (
    <header
      className={cn(
        "border-b border-gray-100 pb-4",
        mobileExpanded || !collapsibleOnMobile ? "mb-6" : "mb-0 md:mb-6"
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 md:items-end md:gap-4",
          headerAddon && !collapsibleOnMobile && "md:gap-4"
        )}
      >
        <div className="min-w-0 flex-1">
          {collapsibleOnMobile ? (
            <button
              type="button"
              aria-expanded={mobileExpanded}
              aria-controls={`${sectionId}-panel`}
              onClick={onToggleMobile}
              className={cn(tourDetailSectionToggleClass, "md:hidden")}
            >
              {titleEl}
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-slate transition-transform",
                  mobileExpanded && "rotate-180"
                )}
                aria-hidden
              />
            </button>
          ) : null}
          <div className={collapsibleOnMobile ? "hidden md:block" : undefined}>{titleEl}</div>
          {showSubtitle ? (
            <div className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">{subtitle}</div>
          ) : null}
        </div>
        {headerAddon ? (
          <div
            className={cn(
              "w-full shrink-0 md:w-auto",
              collapsibleOnMobile && !mobileExpanded && "hidden md:block"
            )}
          >
            {headerAddon}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default function TourSection({
  id,
  title,
  subtitle,
  children,
  className,
  bare = false,
  headerAddon,
  organizerComment,
  collapsibleOnMobile = true,
  defaultMobileExpanded = false,
}: TourSectionProps) {
  const [mobileExpanded, setMobileExpanded] = useState(defaultMobileExpanded);

  const expandSection = useCallback(() => {
    setMobileExpanded(true);
  }, []);

  useEffect(() => {
    if (!collapsibleOnMobile) return;

    const onExpand = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id === id) {
        expandSection();
      }
    };

    window.addEventListener(TOUR_SECTION_EXPAND_EVENT, onExpand);
    return () => window.removeEventListener(TOUR_SECTION_EXPAND_EVENT, onExpand);
  }, [collapsibleOnMobile, expandSection, id]);

  useEffect(() => {
    if (!collapsibleOnMobile) return;
    if (typeof window === "undefined") return;
    if (window.location.hash === `#${id}`) {
      expandSection();
    }
  }, [collapsibleOnMobile, expandSection, id]);

  const body = (
    <>
      {children}
      <TourSectionOrganizerNote comment={organizerComment} />
    </>
  );

  const content = (
    <div
      id={`${id}-panel`}
      role="region"
      aria-labelledby={`${id}-heading`}
      className={cn(collapsibleOnMobile && !mobileExpanded && "hidden md:block")}
    >
      {body}
    </div>
  );

  const header = (
    <TourSectionHeader
      title={title}
      subtitle={subtitle}
      headerAddon={headerAddon}
      collapsibleOnMobile={collapsibleOnMobile}
      mobileExpanded={mobileExpanded}
      onToggleMobile={() => setMobileExpanded((prev) => !prev)}
      sectionId={id}
    />
  );

  if (bare) {
    return (
      <section
        id={id}
        className={cn(siteScrollAnchorClass, "tour-section-target", className)}
      >
        {header}
        {content}
      </section>
    );
  }

  return (
    <section
      id={id}
      className={cn(siteScrollAnchorClass, "tour-section-target", className)}
    >
      <div className={tourDetailSectionCardClass}>
        {header}
        {content}
      </div>
    </section>
  );
}

export function dispatchTourSectionExpand(sectionId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOUR_SECTION_EXPAND_EVENT, { detail: { id: sectionId } })
  );
}
