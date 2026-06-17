import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";
import { tourDetailSectionCardClass } from "@/lib/tour-detail-ui";

type TourSectionProps = {
  id: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Skip outer card — for split layouts like included/excluded */
  bare?: boolean;
  headerAddon?: ReactNode;
};

export const tourSectionScrollMtClass = siteScrollAnchorClass;

function TourSectionHeader({
  title,
  subtitle,
  headerAddon,
}: {
  title: string;
  subtitle?: ReactNode;
  headerAddon?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "mb-6 border-b border-gray-100 pb-4",
        headerAddon && "flex flex-wrap items-end justify-between gap-4"
      )}
    >
      <div className="min-w-0">
        <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">{title}</h2>
        {subtitle ? (
          <div className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">{subtitle}</div>
        ) : null}
      </div>
      {headerAddon}
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
}: TourSectionProps) {
  if (bare) {
    return (
      <section
        id={id}
        className={cn(siteScrollAnchorClass, "tour-section-target", className)}
      >
        <TourSectionHeader title={title} subtitle={subtitle} headerAddon={headerAddon} />
        {children}
      </section>
    );
  }

  return (
    <section
      id={id}
      className={cn(siteScrollAnchorClass, "tour-section-target", className)}
    >
      <div className={tourDetailSectionCardClass}>
        <TourSectionHeader title={title} subtitle={subtitle} headerAddon={headerAddon} />
        {children}
      </div>
    </section>
  );
}
