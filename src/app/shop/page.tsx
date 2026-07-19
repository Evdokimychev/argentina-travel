import ShopPageView from "@/components/shop/ShopPageView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { fetchSiteCommerce } from "@/lib/site-settings-server";

const PAGE_TITLE = "Магазин гидов";
const PAGE_DESCRIPTION =
  "PDF-путеводители и чек-листы для подготовки к поездке в Аргентину — заказ на сайте или через менеджера.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/shop",
});

export default async function ShopPage() {
  const settings = await fetchSiteCommerce();
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/shop" />
      <ShopPageView settings={settings} />
    </>
  );
}
