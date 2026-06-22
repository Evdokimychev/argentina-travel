import { Suspense } from "react";
import FlightsWhitelabelView from "@/components/flights/FlightsWhitelabelView";
import FlightsPageSkeleton from "@/components/flights/FlightsPageSkeleton";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getTravelpayoutsWhitelabelScriptUrl } from "@/lib/travelpayouts/whitelabel/config";

const PAGE_TITLE = "Поиск авиабилетов";
const PAGE_DESCRIPTION =
  "Сравните цены сотен авиакомпаний и агентств. Перелёты в Буэнос-Айрес и по Аргентине — поиск через партнёра Aviasales.";

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
      <Suspense fallback={<FlightsPageSkeleton />}>
        <FlightsWhitelabelView scriptUrl={scriptUrl} />
      </Suspense>
    </>
  );
}
