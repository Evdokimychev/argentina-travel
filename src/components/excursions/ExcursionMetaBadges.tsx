"use client";

import { Baby, Bolt, Users, Footprints } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMovementType } from "@/lib/excursion-labels";
import type { ExcursionDetail } from "@/types/excursion";

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-charcoal/5 px-3 py-1.5 text-xs font-medium text-charcoal",
        className
      )}
    >
      {children}
    </span>
  );
}

export default function ExcursionMetaBadges({
  excursion,
  t,
}: {
  excursion: ExcursionDetail;
  t: (key: string) => string;
}) {
  const movement = formatMovementType(excursion.movementType, t);

  return (
    <div className="flex flex-wrap gap-2">
      {excursion.format ? <Badge>{excursion.format}</Badge> : null}
      {movement ? (
        <Badge>
          <Footprints className="h-3.5 w-3.5" aria-hidden />
          {movement}
        </Badge>
      ) : null}
      {excursion.maxPersons ? (
        <Badge>
          <Users className="h-3.5 w-3.5" aria-hidden />
          {t("excursions.meta.maxPersons").replace("{count}", String(excursion.maxPersons))}
        </Badge>
      ) : null}
      {excursion.childFriendly ? (
        <Badge className="bg-sky/10 text-sky">
          <Baby className="h-3.5 w-3.5" aria-hidden />
          {t("excursions.meta.childFriendly")}
        </Badge>
      ) : null}
      {excursion.instantBooking ? (
        <Badge className="bg-amber-50 text-amber-800">
          <Bolt className="h-3.5 w-3.5" aria-hidden />
          {t("excursions.meta.instantBooking")}
        </Badge>
      ) : null}
      {excursion.visitorsCount ? (
        <Badge>{t("excursions.meta.visitors").replace("{count}", String(excursion.visitorsCount))}</Badge>
      ) : null}
      {excursion.tags.map((tag) => (
        <Badge key={tag.id}>{tag.name}</Badge>
      ))}
    </div>
  );
}
