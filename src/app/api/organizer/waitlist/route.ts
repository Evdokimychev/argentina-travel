import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { fetchOrganizerWaitlist } from "@/lib/organizer-waitlist-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function GET() {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Лист ожидания недоступен" }, { status: 503 });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const user = await loadSessionUserFromSupabase(supabase);
    if (!user || !userHasAccountRole(user, "organizer")) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }
    const entries = await fetchOrganizerWaitlist(createSupabaseAdminClient(), user.id);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось загрузить лист ожидания" },
      { status: 500 }
    );
  }
}
