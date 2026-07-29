import { NextResponse } from "next/server";
import { fetchExcursionDetailResultServer } from "@/lib/tripster/excursion-server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = slug?.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const result = await fetchExcursionDetailResultServer(normalizedSlug);
  if (result.status === "unavailable") {
    return NextResponse.json(
      { error: "Excursions catalog unavailable", code: "catalog_unavailable" },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }
  const excursion = result.data;
  if (!excursion) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  return NextResponse.json(excursion);
}
