import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllShopOrdersAdmin } from "@/lib/shop-order-server";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.shop");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const orders = await fetchAllShopOrdersAdmin(supabase);

  const lines: string[] = [];
  lines.push(
    "id,product_title,product_slug,price_usd,currency,status,payment_status,customer_name,customer_email,customer_phone,delivery_url,notes,created_at"
  );

  for (const row of orders) {
    lines.push(
      [
        csvEscape(row.id),
        csvEscape(row.productTitle),
        csvEscape(row.productSlug),
        String(row.priceUsd),
        csvEscape(row.currency),
        csvEscape(row.status),
        csvEscape(row.paymentStatus),
        csvEscape(row.customerName),
        csvEscape(row.customerEmail),
        csvEscape(row.customerPhone),
        csvEscape(row.deliveryUrl ?? ""),
        csvEscape(row.notes ?? ""),
        row.createdAt,
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="shop-orders-export.csv"',
    },
  });
}
