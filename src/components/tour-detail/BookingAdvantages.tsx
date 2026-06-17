import { useMemo } from "react";
import { CircleCheck } from "lucide-react";
import { resolveTourBookingAdvantages } from "@/data/booking-advantages";
import { cn } from "@/lib/cn";
import { tourDetailAccentTextClass } from "@/lib/tour-detail-ui";
import type { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";

interface BookingAdvantagesProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
  className?: string;
}

export default function BookingAdvantages({
  tour,
  canonicalTour,
  className,
}: BookingAdvantagesProps) {
  const items = useMemo(
    () => [...resolveTourBookingAdvantages(tour, { canonicalTour })],
    [tour, canonicalTour]
  );

  if (items.length === 0) return null;

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-charcoal">
          <CircleCheck className={cn("mt-0.5 h-4 w-4 shrink-0", tourDetailAccentTextClass)} aria-hidden />
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}
