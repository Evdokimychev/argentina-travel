import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import {
  fetchOrganizerInbox,
  markOrganizerInboxRead,
  markOrganizerInboxReadMany,
} from "@/lib/organizer/inbox-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { OrganizerInboxFilter } from "@/types/organizer-inbox";
import { userHasAccountRole } from "@/types/user";

const FILTERS: OrganizerInboxFilter[] = ["all", "unread", "bookings", "reviews", "payments"];

function parseFilter(value: string | null): OrganizerInboxFilter {
  if (value && FILTERS.includes(value as OrganizerInboxFilter)) {
    return value as OrganizerInboxFilter;
  }
  return "all";
}

export async function GET(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Inbox API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const filter = parseFilter(url.searchParams.get("filter"));
    const slugs = getOrganizerCatalogSlugs(sessionUser.id);
    const { items, unreadCount } = await fetchOrganizerInbox(
      supabase,
      sessionUser.id,
      slugs,
      { filter, limit: 50 }
    );

    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Inbox API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      itemKey?: string;
      itemKeys?: string[];
      markAll?: boolean;
    };

    if (body.markAll) {
      const slugs = getOrganizerCatalogSlugs(sessionUser.id);
      const { items } = await fetchOrganizerInbox(supabase, sessionUser.id, slugs, {
        filter: "unread",
        limit: 500,
      });
      const marked = await markOrganizerInboxReadMany(
        supabase,
        sessionUser.id,
        items.map((item) => item.itemKey)
      );
      return NextResponse.json({ marked });
    }

    if (body.itemKeys?.length) {
      const marked = await markOrganizerInboxReadMany(
        supabase,
        sessionUser.id,
        body.itemKeys
      );
      return NextResponse.json({ marked });
    }

    if (body.itemKey) {
      const ok = await markOrganizerInboxRead(supabase, sessionUser.id, body.itemKey);
      if (!ok) {
        return NextResponse.json({ error: "Не удалось отметить прочитанным" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Укажите itemKey или itemKeys" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
