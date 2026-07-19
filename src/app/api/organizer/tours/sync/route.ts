import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function POST() {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Синхронизация предложений недоступна" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Используйте редактор предложения для сохранения черновика" },
      { status: 410 }
    );
  } catch {
    return NextResponse.json(
      { error: "Не удалось проверить синхронизацию. Повторите попытку позже." },
      { status: 500 }
    );
  }
}
