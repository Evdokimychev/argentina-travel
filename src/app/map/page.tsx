import { Suspense } from "react";
import type { Metadata } from "next";
import ArgentinaMapHub from "@/components/map/ArgentinaMapHub";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import MapFeaturedToursJsonLd from "@/components/seo/MapFeaturedToursJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchFeaturedMapTours, fetchMapLayers } from "@/lib/map-layers-server";
import { buildMapPageMetadata } from "@/lib/map-seo";
import { parseMapLayersParam, parseMapUrlState } from "@/lib/map-url-state";

type MapPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  }
  return params;
}

export async function generateMetadata({ searchParams }: MapPageProps): Promise<Metadata> {
  const params = await searchParams;
  return buildMapPageMetadata(params);
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const rawParams = await searchParams;
  const urlParams = toSearchParams(rawParams);
  const urlState = parseMapUrlState(urlParams);
  const layers = parseMapLayersParam(
    typeof rawParams.layer === "string" ? rawParams.layer : null
  );

  const [initialData, featuredTours] = await Promise.all([
    fetchMapLayers({
      city: urlState.city || undefined,
      category: urlState.category || undefined,
      includeTours: layers.includes("tours"),
      includePlaces: layers.includes("places"),
      includeRoutes: layers.includes("routes"),
    }),
    fetchFeaturedMapTours(),
  ]);

  const pageTitle = "Карта Аргентины — туры, места и маршруты";
  const pageDescription =
    "Интерактивная карта Аргентины с турами, местами, провинциями и маршрутами.";

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Карта Аргентины", path: "/map" },
        ]}
      />
      <WebPageJsonLd name={pageTitle} description={pageDescription} path="/map" />
      <MapFeaturedToursJsonLd tours={featuredTours} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate">
            Загрузка карты…
          </div>
        }
      >
        <ArgentinaMapHub initialData={initialData} initialState={urlState} />
      </Suspense>
    </>
  );
}
