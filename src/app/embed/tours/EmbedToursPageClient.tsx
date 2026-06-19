"use client";

import Link from "next/link";
import type { TourListing } from "@/types";
import type { TourEmbedConfig } from "@/types/tour-embed";
import TourEmbedSection from "@/components/embed/TourEmbedSection";

interface EmbedToursPageClientProps {
  config: TourEmbedConfig;
  initialTours: TourListing[];
}

export default function EmbedToursPageClient({
  config,
  initialTours,
}: EmbedToursPageClientProps) {
  return (
    <div className="min-h-screen bg-white p-4 sm:p-5">
      <TourEmbedSection config={{ ...config, tone: config.tone ?? "inline" }} initialTours={initialTours} />
      <p className="mt-6 text-center text-[11px] text-slate/80">
        <Link href="/" className="hover:text-sky hover:underline">
          Пора в Аргентину
        </Link>
      </p>
    </div>
  );
}
