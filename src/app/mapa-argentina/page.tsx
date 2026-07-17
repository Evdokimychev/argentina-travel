import { Suspense } from "react";
import type { Metadata } from "next";
import MapaArgentinaClient from "@/components/map/MapaArgentinaClient";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchMapObjects } from "@/lib/map-objects-server";
import { parseMapArgentinaKindsParam, parseMapArgentinaUrlState } from "@/lib/map-argentina-url-state";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

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

async function MapaArgentinaData({
  kinds,
  urlState,
}: {
  kinds: ReturnType<typeof parseMapArgentinaKindsParam>;
  urlState: ReturnType<typeof parseMapArgentinaUrlState>;
}) {
  const initialData = await fetchMapObjects({
    kinds,
    city: urlState.city || undefined,
    q: urlState.q || undefined,
  });

  return <MapaArgentinaClient initialData={initialData} initialState={urlState} />;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  const title = q
    ? `Карта Аргентины — ${q}`
    : "Интерактивная карта Аргентины — города, парки и экскурсии";
  const description =
    "Полноэкранная карта Аргентины: города, национальные парки, достопримечательности, экскурсии и аэропорты. Поиск и фильтры без перезагрузки. OpenStreetMap + MapLibre.";

  const metadata = buildPublicPageMetadata({
    title,
    description,
    path: "/mapa-argentina",
  });

  return {
    ...metadata,
    alternates: {
      ...buildHreflangAlternates("/mapa-argentina"),
      ...metadata.alternates,
    },
  };
}

export default async function MapaArgentinaPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const urlParams = toSearchParams(rawParams);
  const urlState = parseMapArgentinaUrlState(urlParams);
  const kinds = parseMapArgentinaKindsParam(
    typeof rawParams.kind === "string" ? rawParams.kind : null
  );

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
      <h1 className="sr-only">{pageTitle}</h1>
      <Suspense
        fallback={
          <div className="flex h-[60vh] items-center justify-center text-slate">Загрузка карты…</div>
        }
      >
        <MapaArgentinaData kinds={kinds} urlState={urlState} />
      </Suspense>
    </>
  );
}
