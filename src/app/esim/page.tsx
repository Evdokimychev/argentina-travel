import { Suspense } from "react";
import EsimCatalogView from "@/components/esim/EsimCatalogView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "eSIM для поездки в Аргентину — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "Мобильный интернет через eSIM Airalo: пакеты для Аргентины и соседних стран. Покупка и активация на стороне партнёра.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/esim",
});

export default function EsimPage() {
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/esim" />
      <Suspense fallback={null}>
        <EsimCatalogView />
      </Suspense>
    </>
  );
}
