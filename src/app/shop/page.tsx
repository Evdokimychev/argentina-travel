import ShopPageView from "@/components/shop/ShopPageView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Магазин гидов — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "PDF-путеводители и чек-листы для подготовки к поездке в Аргентину — заказ на сайте или через менеджера.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/shop",
});

export default function ShopPage() {
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/shop" />
      <ShopPageView />
    </>
  );
}
