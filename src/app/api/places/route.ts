import { NextResponse } from "next/server";
import { fetchPlacesServer, fetchPlaceBySlugServer } from "@/lib/places-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const place = await fetchPlaceBySlugServer(slug);
    if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(place);
  }

  const places = await fetchPlacesServer();
  return NextResponse.json({ items: places, total: places.length });
}
