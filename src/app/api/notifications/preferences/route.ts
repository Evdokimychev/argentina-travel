import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  fetchNotificationPreferences,
  upsertNotificationPreferences,
} from "@/lib/notifications/notifications-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { NotificationPreferenceItem, NotificationScope } from "@/types/notifications-hub";
import { userHasAccountRole } from "@/types/user";

function parseScope(value: unknown): NotificationScope | null {
  return value === "organizer" || value === "tourist" ? value : null;
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
    const scope =
      parseScope(url.searchParams.get("scope")) ??
      (userHasAccountRole(sessionUser, "organizer") ? "organizer" : "tourist");

    if (scope === "organizer" && !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const preferences = await fetchNotificationPreferences(supabase, sessionUser.id, scope);
    return NextResponse.json({ preferences, scope });
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
      scope?: NotificationScope;
      preferences?: NotificationPreferenceItem[];
    };

    const scope = parseScope(body.scope);
    if (!scope) {
      return NextResponse.json({ error: "Укажите scope" }, { status: 400 });
    }

    if (scope === "organizer" && !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!Array.isArray(body.preferences) || body.preferences.length === 0) {
      return NextResponse.json({ error: "Укажите preferences" }, { status: 400 });
    }

    const preferences = await upsertNotificationPreferences(
      supabase,
      sessionUser.id,
      scope,
      body.preferences
    );

    return NextResponse.json({ ok: true, preferences, scope });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
