import { Suspense } from "react";
import type { Metadata } from "next";
import ArgentinaMapFullscreenHub from "@/components/map/ArgentinaMapFullscreenHub";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchMapObjects } from "@/lib/map-objects-server";
import { parseMapArgentinaKindsParam, parseMapArgentinaUrlState } from "@/lib/map-argentina-url-state";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else params.set(key, value);
  }
  return params;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  const title = q
    ? `Карта Аргентины — ${q}`
    : "Интерактивная карта Аргентины — города, парки и экскурсии";
  const description =
    "Полноэкранная карта Аргентины: города, национальные парки, достопримечательности, экскурсии и аэропорты. Поиск и фильтры без перезагрузки. OpenStreetMap + MapLibre.";

  return {
    title,
    description,
    alternates: buildHreflangAlternates("/mapa-argentina"),
    openGraph: { title, description, url: "/mapa-argentina", type: "website" },
  };
}

export default async function MapaArgentinaPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const urlParams = toSearchParams(rawParams);
  const urlState = parseMapArgentinaUrlState(urlParams);
  const kinds = parseMapArgentinaKindsParam(
    typeof rawParams.kind === "string" ? rawParams.kind : null
  );

  const initialData = await fetchMapObjects({
    kinds,
    city: urlState.city || undefined,
    q: urlState.q || undefined,
  });

  const pageTitle = "Интерактивная карта Аргентины";
  const pageDescription =
    "Города, национальные парки, достопримечательности, экскурсии и аэропорты на одной карте.";

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Карта Аргентины", path: "/mapa-argentina" },
        ]}
      />
      <WebPageJsonLd name={pageTitle} description={pageDescription} path="/mapa-argentina" />
      <Suspense
        fallback={
          <div className="flex h-[60vh] items-center justify-center text-slate">Загрузка карты…</div>
        }
      >
        <ArgentinaMapFullscreenHub initialData={initialData} initialState={urlState} />
      </Suspense>
    </>
  );
}
