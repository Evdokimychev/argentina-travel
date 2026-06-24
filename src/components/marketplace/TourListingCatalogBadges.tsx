import { Bolt, ShieldCheck } from "lucide-react";
import type { TourListing } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const MAIN_TAG_CLASS =
  "inline-flex items-center rounded-full border border-sky/25 bg-sky/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-dark sm:px-3 sm:py-1 sm:text-xs";

const SECONDARY_TAG_CLASS =
  "inline-flex items-center rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-slate sm:px-3 sm:py-1 sm:text-xs sm:text-charcoal";

/** Тематические метки: основная категория + остальные отдельными бейджами. */
export function ThematicTagBadges({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  const [mainTag, ...otherTags] = tags;

  return (
    <>
      {mainTag ? <span className={MAIN_TAG_CLASS}>{mainTag}</span> : null}
      {otherTags.map((tag) => (
        <span key={tag} className={SECONDARY_TAG_CLASS}>
          {tag}
        </span>
      ))}
    </>
  );
}

/** Тематические метки: основная категория + остальные отдельными бейджами. */
export function TourListingThematicTags({ tour }: { tour: TourListing }) {
  return <ThematicTagBadges tags={tour.partnerThematicTags ?? []} />;
}

/** Overlay badges: мгновенная бронь и гарантия проведения (каталог). */
export function TourListingOverlayBadges({
  tour,
  className,
}: {
  tour: TourListing;
  className?: string;
}) {
  if (!tour.partnerInstantBooking && !tour.partnerTourGuaranteed) return null;

  return (
    <>
      {tour.partnerInstantBooking ? (
        <Badge
          className={cn(
            "border-amber-200/60 bg-amber-50/95 text-amber-900 backdrop-blur-sm shadow-sm",
            className,
          )}
        >
          <Bolt className="h-3 w-3" aria-hidden />
          Мгновенная бронь
        </Badge>
      ) : null}
      {tour.partnerTourGuaranteed ? (
        <Badge
          className={cn(
            "border-emerald-200/60 bg-emerald-50/95 text-emerald-800 backdrop-blur-sm shadow-sm",
            className,
          )}
        >
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Гарантия проведения
        </Badge>
      ) : null}
    </>
  );
}
