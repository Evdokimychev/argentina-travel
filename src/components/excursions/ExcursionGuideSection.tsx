"use client";

import Image from "next/image";
import Link from "next/link";
import TourSection from "@/components/tour-detail/TourSection";
import type { ExcursionGuide } from "@/types/excursion";

export default function ExcursionGuideSection({
  guide,
  title,
  profileLabel,
}: {
  guide: ExcursionGuide;
  title: string;
  profileLabel: string;
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
          <p className="font-heading text-lg font-bold text-charcoal">{guide.name}</p>
          {guide.url ? (
            <Link
              href={guide.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex text-sm font-medium text-sky hover:underline"
            >
              {profileLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </TourSection>
  );
}
