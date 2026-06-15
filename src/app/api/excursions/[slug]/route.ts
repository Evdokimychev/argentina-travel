import { NextResponse } from "next/server";
import { fetchExcursionDetailServer } from "@/lib/tripster/excursion-server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = slug?.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const excursion = await fetchExcursionDetailServer(normalizedSlug);
  if (!excursion) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  return NextResponse.json(excursion);
}
