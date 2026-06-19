import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import {
  fetchOrganizerInbox,
  markOrganizerInboxRead,
  markOrganizerInboxReadMany,
} from "@/lib/organizer/inbox-server";
import {
  fetchNotificationPreferences,
  fetchUnifiedNotifications,
  markAllSystemNotificationsRead,
  markSystemNotificationRead,
} from "@/lib/notifications/notifications-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { NotificationScope } from "@/types/notifications-hub";
import { parseUnifiedInboxId } from "@/types/notifications-hub";
import { userHasAccountRole } from "@/types/user";

function parseScope(value: string | null, sessionRoles: { roles: string[] }): NotificationScope {
  if (value === "organizer" || value === "tourist") return value;
  return userHasAccountRole(sessionRoles as Parameters<typeof userHasAccountRole>[0], "organizer")
    ? "organizer"
    : "tourist";
}

export async function GET(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Notifications API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const scope = parseScope(url.searchParams.get("scope"), sessionUser);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20") || 20, 50);

    if (scope === "organizer" && !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [{ items, unreadCount }, preferences] = await Promise.all([
      fetchUnifiedNotifications(supabase, sessionUser.id, scope, { limit }),
      fetchNotificationPreferences(supabase, sessionUser.id, scope),
    ]);

    return NextResponse.json({ items, unreadCount, preferences, scope });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Notifications API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      itemKey?: string;
      markAll?: boolean;
      scope?: NotificationScope;
    };

    const scope = body.scope ?? "tourist";

    if (body.markAll) {
      const markedSystem = await markAllSystemNotificationsRead(supabase, sessionUser.id);

      let markedInbox = 0;
      if (scope === "organizer" && userHasAccountRole(sessionUser, "organizer")) {
        const slugs = getOrganizerCatalogSlugs(sessionUser.id);
        const { items } = await fetchOrganizerInbox(supabase, sessionUser.id, slugs, {
          filter: "unread",
          limit: 500,
        });
        markedInbox = await markOrganizerInboxReadMany(
          supabase,
          sessionUser.id,
          items.map((item) => item.itemKey)
        );
      }

      return NextResponse.json({ ok: true, markedSystem, markedInbox });
    }

    if (body.itemKey) {
      if (!userHasAccountRole(sessionUser, "organizer")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const ok = await markOrganizerInboxRead(supabase, sessionUser.id, body.itemKey);
      if (!ok) {
        return NextResponse.json({ error: "Не удалось отметить прочитанным" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.id) {
      const inboxKey = parseUnifiedInboxId(body.id);
      if (inboxKey) {
        if (!userHasAccountRole(sessionUser, "organizer")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const ok = await markOrganizerInboxRead(supabase, sessionUser.id, inboxKey);
        if (!ok) {
          return NextResponse.json({ error: "Не удалось отметить прочитанным" }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
      }

      const ok = await markSystemNotificationRead(supabase, sessionUser.id, body.id);
      if (!ok) {
        return NextResponse.json({ error: "Не удалось отметить прочитанным" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Укажите id, itemKey или markAll" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
