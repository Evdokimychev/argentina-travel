import { notFound } from "next/navigation";
import ShopProductDetailView from "@/components/shop/ShopProductDetailView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { getShopProductBySlug } from "@/data/shop-products";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = getShopProductBySlug(slug);
  if (!product) return {};

  return buildPublicPageMetadata({
    title: `${product.title} — Магазин`,
    description: product.description,
    path: `/shop/${product.slug}`,
  });
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getShopProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <WebPageJsonLd
        name={product.title}
        description={product.description}
        path={`/shop/${product.slug}`}
      />
      <ShopProductDetailView product={product} />
    </>
  );
}
