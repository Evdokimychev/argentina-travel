"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { cabinetCardClass, cabinetLinkClass } from "@/lib/cabinet-ui";
import type { GroupTripListingView } from "@/types/group-trips";
import {
  formatGroupTripProgress,
  GROUP_TRIP_LISTING_STATUS_LABELS,
  GROUP_TRIP_MEMBER_STATUS_LABELS,
  isGroupTripJoinable,
} from "@/lib/group-trips-display";
import { formatDateShortWithYear } from "@/lib/utils";

interface GroupTripCardProps {
  listing: GroupTripListingView;
  onJoin?: (listingId: string) => Promise<void>;
  onLeave?: (listingId: string) => Promise<void>;
  onConfirm?: (listingId: string) => Promise<void>;
  onCancel?: (listingId: string) => Promise<void>;
  loadingId?: string | null;
  showTourLink?: boolean;
  organizerMode?: boolean;
}

export default function GroupTripCard({
  listing,
  onJoin,
  onLeave,
  onConfirm,
  onCancel,
  loadingId,
  showTourLink = false,
  organizerMode = false,
}: GroupTripCardProps) {
  const busy = loadingId === listing.id;
  const joinable = isGroupTripJoinable(listing.status);
  const minReached = listing.memberCount >= listing.minParticipants;

  return (
    <article className={cn(cabinetCardClass, "p-4 sm:p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {showTourLink && listing.tourTitle ? (
            <Link
              href={listing.tourSlug ? `/tours/${listing.tourSlug}` : "#"}
              className={cn(cabinetLinkClass, "text-base font-semibold")}
            >
              {listing.tourTitle}
            </Link>
          ) : (
            <p className="text-base font-semibold text-charcoal">
              Ищем попутчиков на {formatDateShortWithYear(listing.slotDate)}
            </p>
          )}
          <p className="mt-1 text-sm text-slate">
            {formatDateShortWithYear(listing.slotDate)} ·{" "}
            {formatGroupTripProgress(
              listing.memberCount,
              listing.minParticipants,
              listing.maxParticipants
            )}
          </p>
          {listing.slotAvailable != null ? (
            <p className="mt-1 text-xs text-muted">
              Свободно в слоте: {listing.slotAvailable}
              {listing.slotCapacity != null ? ` из ${listing.slotCapacity}` : ""}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            listing.status === "confirmed"
              ? "bg-emerald-50 text-emerald-700"
              : listing.status === "cancelled"
                ? "bg-gray-100 text-slate"
                : listing.status === "full"
                  ? "bg-amber-50 text-amber-800"
                  : minReached
                    ? "bg-sky/10 text-sky"
                    : "bg-surface-muted text-slate"
          )}
        >
          {GROUP_TRIP_LISTING_STATUS_LABELS[listing.status]}
        </span>
      </div>

      {listing.description ? (
        <p className="mt-3 text-sm leading-relaxed text-slate">{listing.description}</p>
      ) : null}

      {listing.members && listing.members.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Участники</p>
          <ul className="mt-2 space-y-1.5">
            {listing.members.map((member) => (
              <li key={member.id} className="flex items-center gap-2 text-sm text-charcoal">
                <Users className="h-3.5 w-3.5 text-slate" strokeWidth={1.75} />
                <span>{member.displayName ?? "Участник"}</span>
                <span className="text-xs text-muted">
                  {GROUP_TRIP_MEMBER_STATUS_LABELS[member.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!organizerMode && joinable && !listing.isMember && onJoin ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void onJoin(listing.id)}>
            {busy ? "…" : "Присоединиться"}
          </Button>
        ) : null}
        {!organizerMode && listing.isMember && onLeave ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void onLeave(listing.id)}
          >
            {busy ? "…" : "Выйти из набора"}
          </Button>
        ) : null}
        {organizerMode && listing.status !== "cancelled" && listing.status !== "confirmed" ? (
          <>
            {onConfirm ? (
              <Button
                type="button"
                size="sm"
                disabled={busy || !minReached}
                onClick={() => void onConfirm(listing.id)}
              >
                {busy ? "…" : "Подтвердить состав"}
              </Button>
            ) : null}
            {onCancel ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void onCancel(listing.id)}
              >
                {busy ? "…" : "Отменить набор"}
              </Button>
            ) : null}
          </>
        ) : null}
        {showTourLink && listing.tourSlug ? (
          <Link
            href={`/tours/${listing.tourSlug}`}
            className={cn(cabinetLinkClass, "inline-flex items-center self-center text-sm")}
          >
            Страница тура
          </Link>
        ) : null}
      </div>
    </article>
  );
}
