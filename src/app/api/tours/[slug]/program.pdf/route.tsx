import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { fetchTourDetail } from "@/lib/tours-server";
import { TourItineraryPdfDocument } from "@/lib/tour-itinerary-pdf/TourItineraryPdfDocument";
import {
  buildTourItineraryPdfMeta,
  formatTourPdfFilename,
} from "@/lib/tour-itinerary-pdf/pdf-meta";
import { registerTourPdfFonts } from "@/lib/tour-itinerary-pdf/register-pdf-fonts";
import { buildTourItineraryPdfSource } from "@/lib/tour-itinerary-pdf/types";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const tour = await fetchTourDetail(slug);

    if (!tour || !tour.itinerary?.length) {
      return NextResponse.json({ error: "Тур или программа не найдены" }, { status: 404 });
    }

    registerTourPdfFonts();
    const source = buildTourItineraryPdfSource(tour);
    const meta = buildTourItineraryPdfMeta(slug);
    const buffer = await renderToBuffer(
      <TourItineraryPdfDocument source={source} meta={meta} />
    );
    const filename = formatTourPdfFilename(slug);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сформировать PDF" },
      { status: 500 }
    );
  }
}
