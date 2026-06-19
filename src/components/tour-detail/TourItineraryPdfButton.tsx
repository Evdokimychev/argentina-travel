"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTourPdfFilename } from "@/lib/tour-itinerary-pdf/pdf-meta";
import { tourDetailSecondaryButtonClass, tourDetailAccentTextClass } from "@/lib/tour-detail-ui";
import { getSiteBrandDomain, SITE_BRAND_NAME } from "@/lib/site-brand";
import type { TourDetail } from "@/types";

interface TourItineraryPdfButtonProps {
  tour: TourDetail;
  className?: string;
}

async function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function TourItineraryPdfButton({ tour, className }: TourItineraryPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (loading || !tour.itinerary?.length) return;

    setLoading(true);
    setError(null);
    const filename = formatTourPdfFilename(tour.slug);

    try {
      const response = await fetch(`/api/tours/${encodeURIComponent(tour.slug)}/program.pdf`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Не удалось сформировать PDF на сервере");
      }
      const blob = await response.blob();
      await downloadPdfBlob(blob, filename);
    } catch (serverError) {
      try {
        const { downloadTourItineraryPdfFromTour } = await import(
          "@/lib/tour-itinerary-pdf/download-tour-itinerary-pdf"
        );
        await downloadTourItineraryPdfFromTour(tour);
      } catch (clientError) {
        const message =
          clientError instanceof Error
            ? clientError.message
            : serverError instanceof Error
              ? serverError.message
              : "Не удалось сформировать PDF";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!tour.itinerary?.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        className={cn(
          "flex w-full items-center justify-center gap-2.5",
          tourDetailSecondaryButtonClass
        )}
      >
        {loading ? (
          <Loader2 className={cn("h-4 w-4 animate-spin", tourDetailAccentTextClass)} aria-hidden />
        ) : (
          <FileText className={cn("h-4 w-4", tourDetailAccentTextClass)} aria-hidden />
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
