import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  fetchRecentNotifications,
  fetchUnread,
  syncAdminNotifications,
} from "@/lib/admin/notifications-server";
import { sendAdminUnreadDigestHook } from "@/lib/notifications/email-delivery";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  await syncAdminNotifications(supabase);

  const [notifications, unread] = await Promise.all([
    fetchRecentNotifications(supabase, 20),
    fetchUnread(supabase, 200),
  ]);
  const unreadCount = unread.length;

  // Optional hook for future scheduled digest delivery.
  void sendAdminUnreadDigestHook({ unreadCount });

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}
