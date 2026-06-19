import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { normalizeBookingsFromRows } from "@/lib/bookings-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const ipLimit = await checkRateLimit(`bookings-lookup:ip:${ip}`, 20, 60_000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
    }

    const emailLimit = await checkRateLimit(`bookings-lookup:email:${email}`, 5, 300_000);
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: "Превышен лимит запросов для этого email." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .ilike("contact_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bookings = data?.length ? normalizeBookingsFromRows(data) : [];
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
