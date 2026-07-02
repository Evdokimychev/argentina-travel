import { NextResponse } from "next/server";
import { withCdnCacheHeaders } from "@/lib/cdn-cache";
import {
  fetchMapLayers,
  parseMapLayersBbox,
} from "@/lib/map-layers-server";
import { parseMapLayersParam } from "@/lib/map-url-state";
import { captureException } from "@/lib/monitoring/sentry";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const layers = parseMapLayersParam(searchParams.get("layer"));
    const bbox = parseMapLayersBbox(searchParams.get("bbox"));
    const city = searchParams.get("city")?.trim() || undefined;
    const category = searchParams.get("category")?.trim() || undefined;
    const limit = Number(searchParams.get("limit") ?? "200");

    const payload = await fetchMapLayers({
      bbox,
      city,
      category,
      limit,
      includeTours: layers.includes("tours"),
      includePlaces: layers.includes("places"),
      includeRoutes: layers.includes("routes"),
    });

    return NextResponse.json(payload, withCdnCacheHeaders(undefined, "map-layers"));
  } catch (error) {
    captureException(error, { tags: { route: "api/map/layers" } });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Не удалось загрузить слои карты",
      },
      { status: 500 }
    );
  }
}
