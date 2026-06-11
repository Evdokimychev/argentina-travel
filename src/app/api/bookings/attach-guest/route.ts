import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { attachGuestBookingsByEmail } from "@/lib/bookings-server";
import { attachGuestShopOrdersByEmail } from "@/lib/shop-order-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

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
    if (!sessionUser?.email) {
      return NextResponse.json({ error: "Profile email required" }, { status: 400 });
    }

    const attachedBookings = await attachGuestBookingsByEmail(
      supabase,
      authUser.id,
      sessionUser.email
    );

    const attachedShopOrders = await attachGuestShopOrdersByEmail(
      supabase,
      authUser.id,
      sessionUser.email
    );

    return NextResponse.json({ attached: attachedBookings, attachedShopOrders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
