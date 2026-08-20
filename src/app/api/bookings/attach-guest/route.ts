import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { attachGuestBookingsToCurrentUser } from "@/lib/bookings-server";
import { attachGuestShopOrdersByEmail } from "@/lib/shop-order-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";

export async function POST() {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser || !authUser.email) {
      return NextResponse.json({ error: "Verified account email required" }, { status: 400 });
    }

    const attachedBookings = await attachGuestBookingsToCurrentUser(supabase);

    const attachedShopOrders = await attachGuestShopOrdersByEmail(
      supabase,
      authUser.id,
      authUser.email
    );

    return NextResponse.json({ attached: attachedBookings, attachedShopOrders });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
