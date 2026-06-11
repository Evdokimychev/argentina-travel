import { NextResponse } from "next/server";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import { canAccessShopOrder, fetchShopOrderById } from "@/lib/shop-order-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseShopEnabled()) {
    return NextResponse.json({ error: "Shop API unavailable" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const order = await fetchShopOrderById(supabase, id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!canAccessShopOrder(order, sessionUser, sessionUser.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
