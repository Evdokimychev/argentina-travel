import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { escapeCsvCell } from "@/lib/admin/csv";
import {
  AdminExportTooLargeError,
  collectAdminExportRows,
} from "@/lib/admin/export-pagination";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAttributionByBookingIds } from "@/lib/attribution/attribution-server";
import { rowToBooking, type BookingRow } from "@/lib/bookings-db-mapper";
import { normalizeBooking } from "@/lib/bookings-store";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  let bookingRows: BookingRow[];
  try {
    bookingRows = await collectAdminExportRows(async (from, to) => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data ?? []) as BookingRow[];
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AdminExportTooLargeError
            ? "Выгрузка слишком большая для одного файла. Сузьте период или обратитесь к владельцу сайта."
            : "Не удалось подготовить выгрузку бронирований. Попробуйте ещё раз.",
      },
      { status: error instanceof AdminExportTooLargeError ? 413 : 503 },
    );
  }
  const bookings = bookingRows.map((row) => normalizeBooking(rowToBooking(row)));
  const attributionMap = await fetchAttributionByBookingIds(
    supabase,
    bookings.map((b) => b.id)
  );

  const lines: string[] = [];
  lines.push(
    "id,tour_title,tour_slug,status,contact_name,contact_email,contact_phone,guests,total_price_usd,utm_source,utm_medium,utm_campaign,referrer,landing_path,created_at"
  );

  for (const row of bookings) {
    const attribution = attributionMap.get(row.id) ?? row.attribution;
    lines.push(
      [
        escapeCsvCell(row.id),
        escapeCsvCell(row.tourTitle),
        escapeCsvCell(row.tourSlug),
        escapeCsvCell(row.status),
        escapeCsvCell(row.contactName),
        escapeCsvCell(row.contactEmail),
        escapeCsvCell(row.contactPhone),
        String(row.guests),
        String(row.totalPriceUsd),
        escapeCsvCell(attribution?.utmSource ?? ""),
        escapeCsvCell(attribution?.utmMedium ?? ""),
        escapeCsvCell(attribution?.utmCampaign ?? ""),
        escapeCsvCell(attribution?.referrer ?? ""),
        escapeCsvCell(attribution?.landingPath ?? ""),
        row.createdAt,
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bookings-export.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
