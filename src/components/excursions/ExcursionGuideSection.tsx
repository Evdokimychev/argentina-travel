"use client";

import Image from "next/image";
import Link from "next/link";
import { buildExcursionGuideHref } from "@/lib/tripster/guide-mapper";
import TourSection from "@/components/tour-detail/TourSection";
import type { ExcursionGuide } from "@/types/excursion";

export default function ExcursionGuideSection({
  guide,
  title,
  profileLabel,
  externalProfileLabel,
}: {
  guide: ExcursionGuide;
  title: string;
  profileLabel: string;
  externalProfileLabel?: string;
}) {
  return (
    <TourSection id="guide" title={title}>
      <div className="flex items-start gap-4">
        {guide.avatar ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-muted">
            <Image src={guide.avatar} alt={guide.name} fill className="object-cover" sizes="64px" />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky/10 text-lg font-bold text-sky">
            {guide.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <Link
            href={buildExcursionGuideHref(guide.id)}
            className="font-heading text-lg font-bold text-charcoal transition hover:text-sky"
          >
            {guide.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={buildExcursionGuideHref(guide.id)} className="text-sm font-medium text-sky hover:underline">
              {profileLabel}
            </Link>
            {guide.url && externalProfileLabel ? (
              <Link
                href={guide.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate hover:text-sky hover:underline"
              >
                {externalProfileLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </TourSection>
  );
}
