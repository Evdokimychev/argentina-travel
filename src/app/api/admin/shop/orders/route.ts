import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllShopOrdersAdmin } from "@/lib/shop-order-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.shop");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const orders = await fetchAllShopOrdersAdmin(supabase);

  return NextResponse.json({ orders });
}
