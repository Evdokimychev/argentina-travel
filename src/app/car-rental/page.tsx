import { Suspense } from "react";
import CarRentalView from "@/components/car-rental/CarRentalView";
import MobilityCatalogClient from "@/components/mobility/MobilityCatalogClient";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { PRIMARY_PUBLIC_MARKET } from "@/lib/market-context";
import { resolveMobilityModuleAccess } from "@/lib/mobility/module-policy-server";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Аренда авто в Аргентине";
const PAGE_DESCRIPTION =
  "Прокат автомобиля для поездок по регионам Аргентины. Поиск и бронирование через партнёра LocalRent — удобно для Патагонии, Мендосы и северо-запада.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/car-rental",
});

export default async function CarRentalPage() {
  const access = await resolveMobilityModuleAccess("rental");
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/car-rental" />
      <Suspense fallback={null}>
        <CarRentalView />
      </Suspense>
      {access.allowed && access.allowNativeOffers ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="native-rental-title">
          <h2 id="native-rental-title" className="text-2xl font-bold text-foreground">Автомобили от организаторов</h2>
          <p className="mt-2 max-w-3xl text-muted">Отправьте заявку на выбранный автомобиль. Доступность, итоговую стоимость и условия организатор подтвердит отдельно.</p>
          <div className="mt-6"><MobilityCatalogClient vertical="rental" marketId={PRIMARY_PUBLIC_MARKET.id} /></div>
        </section>
      ) : null}
    </>
  );
}
