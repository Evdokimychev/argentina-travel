import { notFound } from "next/navigation";
import ShopProductDetailView from "@/components/shop/ShopProductDetailView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { fetchSiteCommerce } from "@/lib/site-settings-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";
import { isPublicPathEnabled } from "@/lib/public-module-visibility";
import { fetchPublishedShopProductBySlug, fetchPublishedShopProducts } from "@/lib/shop-products-server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchPublishedShopProductBySlug(slug);
  if (!product) return {};

  return buildPublicPageMetadata({
    title: `${product.title} — Магазин`,
    description: product.description,
    path: `/shop/${product.slug}`,
  });
}

export default async function ShopProductPage({ params }: PageProps) {
  const [{ slug }, settings, navigation, catalog] = await Promise.all([
    params,
    fetchSiteCommerce(),
    fetchSiteNavigation(),
    fetchPublishedShopProducts(),
  ]);
  if (!isPublicPathEnabled("/shop", navigation)) notFound();
  const product = catalog.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <>
      <WebPageJsonLd
        name={product.title}
        description={product.description}
        path={`/shop/${product.slug}`}
      />
      <ShopProductDetailView product={product} settings={settings} relatedProducts={catalog} />
    </>
  );
}
