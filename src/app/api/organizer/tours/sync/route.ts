import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function POST() {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Tours sync unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Используйте редактор предложения для сохранения черновика" },
      { status: 410 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
