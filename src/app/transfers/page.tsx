import { Suspense } from "react";
import MobilityCatalogClient from "@/components/mobility/MobilityCatalogClient";
import TransfersSearchView from "@/components/transfers/TransfersSearchView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { PRIMARY_PUBLIC_MARKET } from "@/lib/market-context";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { resolveMobilityModuleAccess } from "@/lib/mobility/module-policy-server";

const PAGE_TITLE = "Трансферы в Аргентине";
const PAGE_DESCRIPTION =
  "Поиск трансферов из аэропортов EZE и AEP в Буэнос-Айрес и регионы. Сравнение вариантов и переход к бронированию у партнёра Intui.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/transfers",
});

export default async function TransfersPage() {
  const access = await resolveMobilityModuleAccess("transfer");
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/transfers" />
      <Suspense fallback={null}>
        <TransfersSearchView heroImage={getServicePageHeroImage("transfers")} />
      </Suspense>
      {access.allowed && access.allowNativeOffers ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="native-transfer-title">
          <h2 id="native-transfer-title" className="text-2xl font-bold text-foreground">Трансферы от организаторов</h2>
          <p className="mt-2 max-w-3xl text-muted">Оставьте заявку на маршрут. Машину, время встречи и итоговые условия подтвердит организатор.</p>
          <div className="mt-6"><MobilityCatalogClient vertical="transfer" marketId={PRIMARY_PUBLIC_MARKET.id} /></div>
        </section>
      ) : null}
    </>
  );
}
