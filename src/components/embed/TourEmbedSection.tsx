"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TourListing } from "@/types";
import type { TourEmbedConfig } from "@/types/tour-embed";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";
import TourEmbedSectionHeader from "./TourEmbedSectionHeader";
import TourEmbedWidget from "./TourEmbedWidget";

interface TourEmbedSectionProps {
  config: TourEmbedConfig;
  initialTours: TourListing[];
  className?: string;
}

const TONE_STYLES: Record<
  NonNullable<TourEmbedConfig["tone"]>,
  { section: string; showMobileCatalog: boolean }
> = {
  default: {
    section: "",
    showMobileCatalog: true,
  },
  muted: {
    section: "rounded-3xl border border-gray-100 bg-surface-muted/50 p-5 sm:p-6 md:p-8",
    showMobileCatalog: true,
  },
  inline: {
    section: "rounded-3xl border border-sky/10 bg-gradient-to-br from-sky/[0.04] to-white p-5 sm:p-6",
    showMobileCatalog: true,
  },
};

export default function TourEmbedSection({
  config,
  initialTours,
  className,
}: TourEmbedSectionProps) {
  const tone = config.tone ?? "default";
  const toneStyle = TONE_STYLES[tone];
  const compact = tone === "inline";

  return (
    <section
      id={config.id}
      className={cn(config.id && siteScrollAnchorClass, toneStyle.section, className)}
    >
      <TourEmbedSectionHeader
        title={config.title}
        subtitle={config.subtitle}
        catalogHref={config.catalogHref}
        catalogLabel={config.catalogLabel}
        compact={compact}
      />
      <TourEmbedWidget config={config} initialTours={initialTours} />
      {toneStyle.showMobileCatalog && config.catalogHref ? (
        <Link
          href={config.catalogHref}
          className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline sm:hidden"
        >
          {config.catalogLabel ?? "Все туры"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}
