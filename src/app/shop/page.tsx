import ShopPageView from "@/components/shop/ShopPageView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { fetchSiteCommerce, fetchSiteModules, fetchSiteNavigation } from "@/lib/site-settings-server";
import { isPublicPathEnabled } from "@/lib/public-module-visibility";
import { fetchPublishedShopProducts } from "@/lib/shop-products-server";

const PAGE_TITLE = "Магазин гидов";
const PAGE_DESCRIPTION =
  "PDF-путеводители и чек-листы для подготовки к поездке в Аргентину — заказ на сайте или через менеджера.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/shop",
});

export default async function ShopPage() {
  const [settings, navigation, modules, catalog] = await Promise.all([
    fetchSiteCommerce(),
    fetchSiteNavigation(),
    fetchSiteModules(),
    fetchPublishedShopProducts(),
  ]);
  if (!isPublicPathEnabled("/shop", navigation, modules)) notFound();
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/shop" />
      <ShopPageView settings={settings} heroImage={getServicePageHeroImage("shop")} catalog={catalog} />
    </>
  );
}
import { notFound } from "next/navigation";
