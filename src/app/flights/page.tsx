import { Suspense } from "react";
import FlightsSearchView from "@/components/flights/FlightsSearchView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Авиабилеты в Аргентину — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "Поиск перелётов в Буэнос-Айрес и региональные аэропорты через партнёра Aviasales. Сравнение цен и переход к бронированию.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/flights",
});

export default function FlightsPage() {
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/flights" />
      <Suspense fallback={null}>
        <FlightsSearchView />
      </Suspense>
    </>
  );
}
