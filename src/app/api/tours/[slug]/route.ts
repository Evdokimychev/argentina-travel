import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { fetchTourDetailBySlugResultServer } from "@/lib/tour-content-server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json(
      { error: "Tours API unavailable" },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const { slug } = await context.params;
    const result = await fetchTourDetailBySlugResultServer(slug);

    if (result.status === "unavailable") {
      return NextResponse.json(
        { error: "Tours API unavailable" },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }
    const tour = result.data;

    if (!tour) {
      return NextResponse.json({ error: "Тур не найден" }, { status: 404 });
    }

    return NextResponse.json({ tour });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
