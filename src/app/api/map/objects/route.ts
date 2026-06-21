import { NextResponse } from "next/server";
import { fetchMapObjects } from "@/lib/map-objects-server";
import { parseMapLayersBbox } from "@/lib/map-layers-server";
import { parseMapArgentinaKindsParam } from "@/lib/map-argentina-url-state";
import type { MapMarkerKind } from "@/lib/map-types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kinds = parseMapArgentinaKindsParam(url.searchParams.get("kind"));
  const city = url.searchParams.get("city")?.trim() || undefined;
  const q = url.searchParams.get("q")?.trim() || undefined;
  const bbox = parseMapLayersBbox(url.searchParams.get("bbox"));
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;

  const payload = await fetchMapObjects({
    kinds: kinds as MapMarkerKind[],
    city,
    q,
    bbox,
    limit: limit && !Number.isNaN(limit) ? limit : undefined,
  });

  return NextResponse.json(payload);
}
