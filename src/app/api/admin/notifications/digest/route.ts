import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  fetchRecentDigestEvents,
  fetchUserDigestEvents,
} from "@/lib/notifications/notifications-server";
import { sendDailyDigestEmail } from "@/lib/notifications/email-delivery";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  const supabase = createSupabaseAdminClient();
  const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString();

  if (body.userId?.trim()) {
    const userId = body.userId.trim();
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    const events = await fetchUserDigestEvents(supabase, userId, sinceIso);
    const sent = await sendDailyDigestEmail({
      recipientEmail: profile?.email ?? null,
      recipientName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null,
      events,
      scopeLabel: "личный кабинет",
    });

    return NextResponse.json({ ok: true, sent, eventsCount: events.length, userId });
  }

  const events = await fetchRecentDigestEvents(supabase, sinceIso, 100);
  const sent = await sendDailyDigestEmail({
    recipientEmail: process.env.LEADS_NOTIFY_EMAIL?.trim() ?? null,
    recipientName: "Администратор",
    events,
    scopeLabel: "платформа",
  });

  return NextResponse.json({ ok: true, sent, eventsCount: events.length, mode: "platform" });
}
