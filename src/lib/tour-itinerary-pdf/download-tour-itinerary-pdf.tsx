"use client";

import { pdf } from "@react-pdf/renderer";
import { TourItineraryPdfDocument } from "@/lib/tour-itinerary-pdf/TourItineraryPdfDocument";
import {
  buildTourItineraryPdfMeta,
  formatTourPdfFilename,
} from "@/lib/tour-itinerary-pdf/pdf-meta";
import { registerTourPdfFonts } from "@/lib/tour-itinerary-pdf/register-pdf-fonts";
import {
  buildTourItineraryPdfSource,
  type TourItineraryPdfSource,
} from "@/lib/tour-itinerary-pdf/types";
import type { TourDetail } from "@/types";

let fontsReady = false;

function ensureFonts() {
  if (!fontsReady) {
    registerTourPdfFonts();
    fontsReady = true;
  }
}

export async function downloadTourItineraryPdfFromTour(tour: TourDetail): Promise<void> {
  return downloadTourItineraryPdf(buildTourItineraryPdfSource(tour));
}

export async function downloadTourItineraryPdf(source: TourItineraryPdfSource): Promise<void> {
  if (!source.itinerary.length) {
    throw new Error("Программа тура пуста");
  }

  ensureFonts();

  const meta = buildTourItineraryPdfMeta(source.slug);
  const blob = await pdf(<TourItineraryPdfDocument source={source} meta={meta} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = formatTourPdfFilename(source.slug);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
