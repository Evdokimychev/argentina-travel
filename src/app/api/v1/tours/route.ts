import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { handlePublicApiRequest, publicApiJson } from "@/lib/public-api/handlers";
import {
  buildPublicApiPagination,
  filterToursForPublicApi,
  paginateItems,
  parsePublicApiPagination,
  serializePublicTourListing,
} from "@/lib/public-api/serializers";
import { fetchPublishedListingsServer } from "@/lib/tour-content-server";

export async function GET(request: Request) {
  return handlePublicApiRequest(request, "tours:read", async (req, { key }) => {
    if (!isSupabaseToursEnabled()) {
      return publicApiJson({ error: "Tours API unavailable" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const { page, pageSize } = parsePublicApiPagination(searchParams);
    const organizerSlug = searchParams.get("organizer")?.trim() || null;

    const tours = await fetchPublishedListingsServer();
    const filtered = filterToursForPublicApi(tours, {
      organizerSlug,
      organizerId: key.organizerId,
    });
    const pageItems = paginateItems(filtered, page, pageSize);

    return publicApiJson({
      data: pageItems.map(serializePublicTourListing),
      pagination: buildPublicApiPagination(filtered.length, page, pageSize),
    });
  });
}

export async function OPTIONS(request: Request) {
  return handlePublicApiRequest(request, "tours:read", async () => NextResponse.json({ ok: true }));
}
