import { NextResponse } from "next/server";
import { executeSiteSearch } from "@/lib/search/search-query";
import { SEARCH_TYPE_LABELS } from "@/lib/site-search-index";
import { fetchSiteControlPlaneEdge } from "@/lib/site-settings-edge";
import { isPublicPathIncludedInSearch } from "@/lib/public-module-visibility";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { fetchExcursionsServer } from "@/lib/tripster/excursion-server";
import { filterSearchHitsByPublicCatalog } from "@/lib/search/public-catalog-results";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const kind = searchParams.get("kind") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  if (q.length > 200) {
    return NextResponse.json({ error: "Слишком длинный поисковый запрос" }, { status: 400 });
  }
  if (kind && !(kind in SEARCH_TYPE_LABELS)) {
    return NextResponse.json({ error: "Неизвестный тип поиска" }, { status: 400 });
  }

  const [payload, controlPlane, tours, excursionsResult] = await Promise.all([
    executeSiteSearch(q, {
      kind,
      limit: Number.isFinite(limit) ? limit : undefined,
    }),
    fetchSiteControlPlaneEdge(),
    fetchMarketplaceTours(),
    fetchExcursionsServer({ pageSize: 500 }).catch(() => ({ items: [], cities: [] })),
  ]);
  const currentCatalogResults = filterSearchHitsByPublicCatalog(payload.results, {
    tours: new Set(tours.map((tour) => `/tours/${tour.slug}`)),
    excursions: new Set(
      excursionsResult.items.map((excursion) => `/excursions/${excursion.slug}`),
    ),
  });
  const visiblePayload = {
    ...payload,
    results: currentCatalogResults.filter((result) =>
      isPublicPathIncludedInSearch(
        result.url,
        controlPlane.navigation,
        controlPlane.modules,
      ),
    ),
  };

  const tookMs = payload.tookMs ?? Date.now() - startedAt;

  return NextResponse.json(
    { ...visiblePayload, tookMs },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        "Server-Timing": `search;dur=${tookMs}`,
      },
    }
  );
}
