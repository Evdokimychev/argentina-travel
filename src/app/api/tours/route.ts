import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { fetchPublishedListings } from "@/lib/tour-content-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Tours API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const tours = await fetchPublishedListings(supabase);
    return NextResponse.json({ tours });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
