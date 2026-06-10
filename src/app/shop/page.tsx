import ShopPageView from "@/components/shop/ShopPageView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Магазин гидов — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "PDF-путеводители и чеклисты для подготовки к поездке в Аргентину — запрос через менеджера.";

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
