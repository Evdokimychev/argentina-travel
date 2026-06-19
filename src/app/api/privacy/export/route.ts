import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { buildUserPrivacyExport } from "@/lib/privacy/export-user-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

export async function POST() {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Privacy API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await buildUserPrivacyExport(supabase, sessionUser);

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="privacy-export-${sessionUser.id}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
