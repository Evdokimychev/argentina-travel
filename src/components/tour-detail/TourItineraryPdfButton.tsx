"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { getSiteBrandDomain, SITE_BRAND_NAME } from "@/lib/site-brand";
import type { TourDetail } from "@/types";

interface TourItineraryPdfButtonProps {
  tour: TourDetail;
  className?: string;
}

export default function TourItineraryPdfButton({ tour, className }: TourItineraryPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (loading || !tour.itinerary?.length) return;

    setLoading(true);
    setError(null);

    try {
      const { downloadTourItineraryPdfFromTour } = await import(
        "@/lib/tour-itinerary-pdf/download-tour-itinerary-pdf"
      );
      await downloadTourItineraryPdfFromTour(tour);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сформировать PDF");
    } finally {
      setLoading(false);
    }
  }

  if (!tour.itinerary?.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={cn(
          "flex w-full items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-charcoal transition-colors",
          "hover:border-sky/30 hover:bg-sky/[0.06] disabled:cursor-wait disabled:opacity-70"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-sky" aria-hidden />
        ) : (
          <FileText className="h-4 w-4 text-red-600" aria-hidden />
        )}
        {loading ? "Формируем PDF…" : "Получить программу тура в PDF"}
      </button>
      {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
      <p className="text-center text-[11px] leading-relaxed text-slate">
        Официальная программа с сайта «{SITE_BRAND_NAME}» · {getSiteBrandDomain()}
      </p>
    </div>
  );
}
