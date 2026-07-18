export type ShopProductStatus = "draft" | "published" | "archived";
export type ShopProductAvailability = "unlimited" | "in_stock" | "out_of_stock" | "preorder";
export type ShopProductDeliveryType = "digital" | "physical" | "service";

export type ShopProductImage = {
  url: string;
  alt: string;
};

export type ShopProduct = {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  slug: string;
  title: string;
  description: string;
  format: string;
  deliveryType: ShopProductDeliveryType;
  priceMinor: number;
  currency: string;
  availability: ShopProductAvailability;
  stockQuantity: number | null;
  status: ShopProductStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ShopProductImage[];
  image: string;
  imageAlt: string;
  version: number;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
};

export function formatShopMoney(priceMinor: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceMinor / 100);
}
