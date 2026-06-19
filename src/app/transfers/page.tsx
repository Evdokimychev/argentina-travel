import { Suspense } from "react";
import TransfersSearchView from "@/components/transfers/TransfersSearchView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Трансферы в Аргентине — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "Поиск трансферов из аэропортов EZE и AEP в Буэнос-Айрес и регионы. Сравнение вариантов и переход к бронированию у партнёра Intui.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/transfers",
});

export default function TransfersPage() {
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/transfers" />
      <Suspense fallback={null}>
        <TransfersSearchView />
      </Suspense>
    </>
  );
}
