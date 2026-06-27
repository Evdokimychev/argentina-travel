"use client";

import { Fragment } from "react";
import { Baby, Bolt, Users, Footprints } from "lucide-react";
import { cn } from "@/lib/cn";
import { excursionFormatLabelKey } from "@/lib/excursion-listing-meta";
import { formatMovementType } from "@/lib/excursion-labels";
import { filterExcursionDisplayTags } from "@/lib/excursion-display-tags";
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
  const formatKind = excursion.formatKind ?? "individual";
  const formatLabel = t(excursionFormatLabelKey(formatKind));

  const badges: Array<{ key: string; label: string; node: React.ReactNode }> = [];

  function addBadge(key: string, label: string, node: React.ReactNode) {
    const normalized = label.trim().toLowerCase();
    if (!normalized || badges.some((badge) => badge.label === normalized)) return;
    badges.push({ key, label: normalized, node });
  }

  addBadge("format", formatLabel, <Badge>{formatLabel}</Badge>);

  if (movement) {
    addBadge(
      "movement",
      movement,
      <Badge>
        <Footprints className="h-3.5 w-3.5" aria-hidden />
        {movement}
      </Badge>
    );
  }

  if (excursion.maxPersons) {
    const label = t("excursions.meta.maxPersons").replace("{count}", String(excursion.maxPersons));
    addBadge(
      "maxPersons",
      label,
      <Badge>
        <Users className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (excursion.childFriendly) {
    const label = t("excursions.meta.childFriendly");
    addBadge(
      "childFriendly",
      label,
      <Badge className="bg-sky/10 text-sky">
        <Baby className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (excursion.instantBooking) {
    const label = t("excursions.meta.instantBooking");
    addBadge(
      "instantBooking",
      label,
      <Badge className="bg-amber-50 text-amber-800">
        <Bolt className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Badge>
    );
  }

  if (excursion.visitorsCount) {
    const label = t("excursions.meta.visitors").replace("{count}", String(excursion.visitorsCount));
    addBadge("visitors", label, <Badge>{label}</Badge>);
  }

  for (const language of excursion.languages ?? []) {
    addBadge(`language-${language}`, language, <Badge className="bg-sky/10 text-sky">{language}</Badge>);
  }

  const thematicTags = filterExcursionDisplayTags(excursion.tags ?? [], {
    existingLabels: badges.map((badge) => badge.label),
    childFriendly: excursion.childFriendly,
  });

  for (const tag of thematicTags) {
    addBadge(`tag-${tag.id}`, tag.name, <Badge>{tag.name}</Badge>);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Fragment key={badge.key}>{badge.node}</Fragment>
      ))}
    </div>
  );
}
