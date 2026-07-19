import "server-only";

import { SHOP_PRODUCTS } from "@/data/shop-products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ShopProduct, ShopProductImage } from "@/types/shop-product";

type ProductRow = {
  id: string;
  category_id: string | null;
  slug: string;
  title: string;
  description: string;
  format_label: string;
  delivery_type: ShopProduct["deliveryType"];
  price_minor: number | string;
  currency: string;
  availability: ShopProduct["availability"];
  stock_quantity: number | null;
  status: ShopProduct["status"];
  seo_title: string | null;
  seo_description: string | null;
  version: number | string;
  published_at: string | null;
  archived_at: string | null;
  updated_at: string;
  shop_product_categories?: { name?: string } | Array<{ name?: string }> | null;
  shop_product_images?: Array<{ url: string; alt: string; sort_order: number }> | null;
};

const PRODUCT_SELECT = [
  "id", "category_id", "slug", "title", "description", "format_label",
  "delivery_type", "price_minor", "currency", "availability", "stock_quantity",
  "status", "seo_title", "seo_description", "version", "published_at",
  "archived_at", "updated_at", "shop_product_categories(name)",
  "shop_product_images(url,alt,sort_order)",
].join(",");

function mapProduct(row: ProductRow): ShopProduct {
  const rawCategory = row.shop_product_categories;
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const images: ShopProductImage[] = [...(row.shop_product_images ?? [])]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(({ url, alt }) => ({ url, alt }));
  const firstImage = images[0] ?? { url: "/media/shop/patagonia-pdf-guide.jpg", alt: row.title };
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    slug: row.slug,
    title: row.title,
    description: row.description,
    format: row.format_label,
    deliveryType: row.delivery_type,
    priceMinor: Number(row.price_minor),
    currency: row.currency,
    availability: row.availability,
    stockQuantity: row.stock_quantity,
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    images,
    image: firstImage.url,
    imageAlt: firstImage.alt,
    version: Number(row.version),
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchPublishedShopProducts(): Promise<ShopProduct[]> {
  if (!isSupabaseConfigured()) return SHOP_PRODUCTS;
  try {
    const supabase = createSupabaseAdminClient();
    // This table is introduced ahead of generated database types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) return [];
    return ((data ?? []) as ProductRow[]).map(mapProduct);
  } catch {
    return [];
  }
}

export async function fetchPublishedShopProductBySlug(slug: string): Promise<ShopProduct | null> {
  if (!isSupabaseConfigured()) return SHOP_PRODUCTS.find((product) => product.slug === slug) ?? null;
  try {
    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("shop_products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    return error || !data ? null : mapProduct(data as ProductRow);
  } catch {
    return null;
  }
}

export { mapProduct as mapShopProductRow, PRODUCT_SELECT as SHOP_PRODUCT_SELECT };
