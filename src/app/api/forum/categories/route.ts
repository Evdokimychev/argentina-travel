import { NextResponse } from "next/server";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { fetchForumCategories } from "@/lib/forum/forum-server";
import { rejectIfPublicModuleQuarantined } from "@/lib/modules/dormant-quarantine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";

export async function GET() {
  const quarantined = await rejectIfPublicModuleQuarantined("/forum", { labelRu: "Форум" });
  if (quarantined) return quarantined;

  if (!isSupabaseForumEnabled()) {
    return NextResponse.json({ error: "Форум недоступен" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const categories = await fetchForumCategories(supabase);
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
