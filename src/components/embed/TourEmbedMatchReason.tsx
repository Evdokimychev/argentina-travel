import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export default function TourEmbedMatchReason({
  reason,
  className,
}: {
  reason?: string;
  className?: string;
}) {
  if (!reason) return null;

  return (
    <p className={cn("flex items-start gap-1.5 text-xs leading-relaxed text-sky-ink", className)}>
      <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" aria-hidden />
      <span>
        <span className="font-semibold">Почему подходит:</span> {reason}
      </span>
    </p>
  );
}
