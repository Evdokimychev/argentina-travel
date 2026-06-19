import { Suspense } from "react";
import CarRentalView from "@/components/car-rental/CarRentalView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Аренда авто в Аргентине";
const PAGE_DESCRIPTION =
  "Прокат автомобиля для поездок по регионам Аргентины. Поиск и бронирование через партнёра LocalRent — удобно для Патагонии, Мендосы и северо-запада.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/car-rental",
});

export default function CarRentalPage() {
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/car-rental" />
      <Suspense fallback={null}>
        <CarRentalView />
      </Suspense>
    </>
  );
}
