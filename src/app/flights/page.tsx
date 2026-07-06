import { Suspense } from "react";
import FlightsWhitelabelView from "@/components/flights/FlightsWhitelabelView";
import FlightsPageSkeleton from "@/components/flights/FlightsPageSkeleton";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildTwoLevelBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
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

export default async function FlightsPage() {
  const locale = await getServerI18nLocale();
  const scriptUrl = getTravelpayoutsWhitelabelScriptUrl();

  return (
    <>
      <BreadcrumbListJsonLd
        items={buildTwoLevelBreadcrumbItems(locale, {
          labelKey: "flights.route.breadcrumb.flights",
          path: "/flights",
          fallback: PAGE_TITLE,
        })}
      />
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/flights" />
      <Suspense fallback={<FlightsPageSkeleton />}>
        <FlightsWhitelabelView scriptUrl={scriptUrl} />
      </Suspense>
    </>
  );
}
