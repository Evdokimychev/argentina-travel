import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllBookingsAdmin } from "@/lib/admin/bookings-server";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const bookings = await fetchAllBookingsAdmin(supabase);

  const lines: string[] = [];
  lines.push(
    "id,tour_title,tour_slug,status,contact_name,contact_email,contact_phone,guests,total_price_usd,created_at"
  );

  for (const row of bookings) {
    lines.push(
      [
        csvEscape(row.id),
        csvEscape(row.tourTitle),
        csvEscape(row.tourSlug),
        csvEscape(row.status),
        csvEscape(row.contactName),
        csvEscape(row.contactEmail),
        csvEscape(row.contactPhone),
        String(row.guests),
        String(row.totalPriceUsd),
        row.createdAt,
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bookings-export.csv"',
    },
  });
}
