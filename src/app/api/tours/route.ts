import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { fetchPublishedListingsServer } from "@/lib/tour-content-server";

export async function GET() {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Tours API unavailable" }, { status: 503 });
  }

  try {
    const tours = await fetchPublishedListingsServer();
    return NextResponse.json({ tours });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
