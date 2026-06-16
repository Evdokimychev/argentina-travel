import { Suspense } from "react";
import FlightsWhitelabelView from "@/components/flights/FlightsWhitelabelView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getTravelpayoutsWhitelabelScriptUrl } from "@/lib/travelpayouts/whitelabel/config";

const PAGE_TITLE = "Авиабилеты в Аргентину — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "Поиск перелётов в Буэнос-Айрес и региональные аэропорты через партнёра Aviasales. Сравнение цен и переход к бронированию.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/flights",
});

export default function FlightsPage() {
  const scriptUrl = getTravelpayoutsWhitelabelScriptUrl();

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/flights" />
      <Suspense fallback={null}>
        <FlightsWhitelabelView scriptUrl={scriptUrl} />
      </Suspense>
    </>
  );
}
