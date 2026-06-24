import { ArrowRight, Flag, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TourEndpointLabels } from "@/lib/tour-route-endpoints";

type TourRouteEndpointsChipProps = {
  endpoints: TourEndpointLabels;
  className?: string;
};

export default function TourRouteEndpointsChip({
  endpoints,
  className,
}: TourRouteEndpointsChipProps) {
  const { start, finish } = endpoints;
  if (!start && !finish) return null;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/80 px-2.5 py-1 text-xs text-slate shadow-sm",
        className,
      )}
      title={start && finish ? `${start} → ${finish}` : start ?? finish}
    >
      {start ? (
        <>
          <Flag className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
          <span className="truncate">{start}</span>
        </>
      ) : null}
      {start && finish ? (
        <ArrowRight className="h-3 w-3 shrink-0 text-slate/50" aria-hidden />
      ) : null}
      {finish ? (
        <>
          <MapPin className="h-3.5 w-3.5 shrink-0 text-charcoal/60" aria-hidden />
          <span className="truncate">{finish}</span>
        </>
      ) : null}
    </span>
  );
}
