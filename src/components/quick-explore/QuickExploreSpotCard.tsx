"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, MapPin, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { MAP_MARKER_KIND_LABELS } from "@/lib/map-types";
import type { QuickExploreSpot } from "@/lib/quick-explore/types";
import { tokenButtonPrimaryClass, tokenFocusRingClass } from "@/lib/design-tokens";

type Props = {
  spot: QuickExploreSpot;
  onClose: () => void;
  onNavigate?: (href: string) => void;
  className?: string;
};

export default function QuickExploreSpotCard({ spot, onClose, onNavigate, className }: Props) {
  const primaryHref = spot.hrefPlace ?? spot.hrefKb;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated shadow-elevated transition-shadow duration-200",
        className
      )}
    >
      {spot.image?.url ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-charcoal/5">
          <Image
            src={spot.image.url}
            alt={spot.image.alt ?? spot.title}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover"
            unoptimized={spot.image.url.startsWith("http")}
          />
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/40 text-white backdrop-blur-sm transition-colors hover:bg-charcoal/60",
              tokenFocusRingClass
            )}
            aria-label="Свернуть карточку"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-2xs font-semibold uppercase tracking-wide text-sky">
              {MAP_MARKER_KIND_LABELS[spot.kind]}
            </p>
            <h3 className="text-base font-bold leading-snug text-foreground">{spot.title}</h3>
          </div>
          {!spot.image?.url ? (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-surface-muted hover:text-foreground",
                tokenFocusRingClass
              )}
              aria-label="Свернуть карточку"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>

        {spot.summary ? (
          <p className="line-clamp-4 text-sm leading-relaxed text-slate">{spot.summary}</p>
        ) : null}

        {spot.image?.credit ? (
          <p className="text-2xs leading-relaxed text-slate/80">
            {spot.image.sourceUrl ? (
              <>
                {spot.image.credit.split(" · ").slice(0, -1).join(" · ")}
                {" · "}
                <a
                  href={spot.image.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate/30 underline-offset-2 hover:text-sky"
                >
                  источник
                </a>
              </>
            ) : (
              spot.image.credit
            )}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          {primaryHref ? (
            <Link
              href={primaryHref}
              onClick={(event) => {
                if (!onNavigate) return;
                event.preventDefault();
                onNavigate(primaryHref);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold transition-colors",
                tokenButtonPrimaryClass,
                tokenFocusRingClass
              )}
            >
              {spot.hrefPlace ? (
                <>
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                  Подробнее
                </>
              ) : (
                <>
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                  В базе знаний
                </>
              )}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          ) : null}
          {spot.hrefKb && spot.hrefPlace ? (
            <Link
              href={spot.hrefKb}
              onClick={(event) => {
                if (!onNavigate) return;
                event.preventDefault();
                onNavigate(spot.hrefKb!);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border border-border-subtle px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-sky/30 hover:bg-sky/5",
                tokenFocusRingClass
              )}
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
              База знаний
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
