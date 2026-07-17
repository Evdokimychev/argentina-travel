import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  shopCatalogError,
  type AdminShopCategory,
  type ShopCategoryDraft,
  type ShopProductDraft,
} from "@/lib/admin/shop-catalog-contract";
import { mapShopProductRow, SHOP_PRODUCT_SELECT } from "@/lib/shop-products-server";
import type { ShopProduct } from "@/types/shop-product";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  version: number | string;
  updated_at: string;
};

type RpcPayload = { ok?: boolean; code?: string };

export async function fetchAdminShopCatalog(): Promise<{
  products: ShopProduct[];
  categories: AdminShopCategory[];
}> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) throw new Error("SHOP_CATALOG_UNAVAILABLE");
  const supabase = createSupabaseAdminClient();
  // The migration intentionally leads generated database types; keep this boundary server-only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const [productsResult, categoriesResult] = await Promise.all([
    db.from("shop_products").select(SHOP_PRODUCT_SELECT).order("updated_at", { ascending: false }),
    db.from("shop_product_categories")
      .select("id,slug,name,description,is_active,sort_order,version,updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);
  if (productsResult.error || categoriesResult.error) throw new Error("SHOP_CATALOG_UNAVAILABLE");
  const products = (productsResult.data ?? []).map(mapShopProductRow) as ShopProduct[];
  const productCount = new Map<string, number>();
  for (const product of products) {
    if (product.categoryId) productCount.set(product.categoryId, (productCount.get(product.categoryId) ?? 0) + 1);
  }
  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    version: Number(row.version),
    updatedAt: row.updated_at,
    productCount: productCount.get(row.id) ?? 0,
  }));
  return { products, categories };
}

export async function mutateShopProduct(input: {
  action: "create" | "update" | "archive";
  actorId: string;
  productId: string | null;
  expectedVersion: number | null;
  expectedUpdatedAt: string | null;
  draft: ShopProductDraft | null;
  ipAddress: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return { ok: false, ...shopCatalogError() };
  const draft = input.draft;
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_manage_shop_product", {
    p_action: input.action,
    p_actor_id: input.actorId,
    p_product_id: input.productId,
    p_expected_version: input.expectedVersion,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_category_id: draft?.categoryId ?? null,
    p_slug: draft?.slug ?? "unused",
    p_title: draft?.title ?? "unused",
    p_description: draft?.description ?? "",
    p_format_label: draft?.format ?? "",
    p_delivery_type: draft?.deliveryType ?? "digital",
    p_price_minor: draft?.priceMinor ?? 0,
    p_currency: draft?.currency ?? "USD",
    p_availability: draft?.availability ?? "out_of_stock",
    p_stock_quantity: draft?.stockQuantity ?? 0,
    p_status: draft?.status ?? "draft",
    p_seo_title: draft?.seoTitle ?? null,
    p_seo_description: draft?.seoDescription ?? null,
    p_images: draft?.images ?? [],
    p_ip_address: input.ipAddress,
  });
  if (error) return { ok: false, ...shopCatalogError() };
  const payload = data as RpcPayload | null;
  return payload?.ok ? { ok: true } : { ok: false, ...shopCatalogError(payload?.code) };
}

export async function mutateShopCategory(input: {
  action: "create" | "update" | "archive";
  actorId: string;
  categoryId: string | null;
  expectedVersion: number | null;
  expectedUpdatedAt: string | null;
  draft: ShopCategoryDraft | null;
  ipAddress: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return { ok: false, ...shopCatalogError() };
  const draft = input.draft;
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_manage_shop_category", {
    p_action: input.action,
    p_actor_id: input.actorId,
    p_category_id: input.categoryId,
    p_expected_version: input.expectedVersion,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_slug: draft?.slug ?? "unused",
    p_name: draft?.name ?? "unused",
    p_description: draft?.description ?? null,
    p_sort_order: draft?.sortOrder ?? 0,
    p_ip_address: input.ipAddress,
  });
  if (error) return { ok: false, ...shopCatalogError() };
  const payload = data as RpcPayload | null;
  return payload?.ok ? { ok: true } : { ok: false, ...shopCatalogError(payload?.code) };
}
