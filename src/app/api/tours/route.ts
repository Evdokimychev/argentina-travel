import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";
import { fetchPublishedListingsResultServer } from "@/lib/tour-content-server";

export async function GET() {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json(
      { error: "Tours API unavailable" },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const result = await fetchPublishedListingsResultServer();
    if (result.status === "unavailable") {
      return NextResponse.json(
        { error: "Tours API unavailable" },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }
    return NextResponse.json({ tours: result.data });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
