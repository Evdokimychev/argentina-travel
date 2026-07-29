import { NextResponse } from "next/server";
import { fetchExcursionsResultServer } from "@/lib/excursion-server";
import { handlePublicApiRequest, publicApiJson } from "@/lib/public-api/handlers";
import {
  buildPublicApiPagination,
  parsePublicApiPagination,
  serializePublicExcursionListing,
} from "@/lib/public-api/serializers";
import type { ExcursionListFilters } from "@/types/excursion";

export async function GET(request: Request) {
  return handlePublicApiRequest(request, "excursions:read", async (req) => {
    const { searchParams } = new URL(req.url);
    const { page, pageSize } = parsePublicApiPagination(searchParams);

    const filters: ExcursionListFilters = {
      page,
      pageSize,
      citySlug: searchParams.get("city")?.trim() || undefined,
      query: searchParams.get("q")?.trim() || undefined,
      sort: (searchParams.get("sort") as ExcursionListFilters["sort"]) || "popular",
    };

    const result = await fetchExcursionsResultServer(filters);
    if (result.status === "unavailable") {
      return publicApiJson(
        { error: "Excursions catalog unavailable", code: "catalog_unavailable" },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }

    return publicApiJson({
      data: result.data.items.map(serializePublicExcursionListing),
      pagination: buildPublicApiPagination(
        result.data.total,
        result.data.page,
        result.data.pageSize,
      ),
    });
  });
}

export async function OPTIONS(request: Request) {
  return handlePublicApiRequest(request, "excursions:read", async () => NextResponse.json({ ok: true }));
}
