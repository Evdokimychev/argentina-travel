import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { escapeCsvCell } from "@/lib/admin/csv";
import {
  AdminExportTooLargeError,
  collectAdminExportRows,
} from "@/lib/admin/export-pagination";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rowsToShopOrders } from "@/lib/shop-order-mapper";
import type { ShopOrderRow } from "@/types/database";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.shop");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  let orderRows: ShopOrderRow[];
  try {
    orderRows = await collectAdminExportRows(async (from, to) => {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data ?? [];
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AdminExportTooLargeError
            ? "Выгрузка слишком большая для одного файла. Сузьте период или обратитесь к владельцу сайта."
            : "Не удалось подготовить выгрузку заказов. Попробуйте ещё раз.",
      },
      { status: error instanceof AdminExportTooLargeError ? 413 : 503 },
    );
  }
  const orders = rowsToShopOrders(orderRows);

  const lines: string[] = [];
  lines.push(
    "id,product_title,product_slug,price_usd,currency,status,payment_status,customer_name,customer_email,customer_phone,delivery_url,notes,created_at"
  );

  for (const row of orders) {
    lines.push(
      [
        escapeCsvCell(row.id),
        escapeCsvCell(row.productTitle),
        escapeCsvCell(row.productSlug),
        String(row.priceUsd),
        escapeCsvCell(row.currency),
        escapeCsvCell(row.status),
        escapeCsvCell(row.paymentStatus),
        escapeCsvCell(row.customerName),
        escapeCsvCell(row.customerEmail),
        escapeCsvCell(row.customerPhone),
        escapeCsvCell(row.deliveryUrl ?? ""),
        escapeCsvCell(row.notes ?? ""),
        row.createdAt,
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="shop-orders-export.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
