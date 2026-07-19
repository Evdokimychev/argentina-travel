import { getShopProductImage } from "@/lib/media-resolver";
import { getShopProductAlt } from "@/lib/media-resolver";
import type { ShopProduct } from "@/types/shop-product";

export type { ShopProduct } from "@/types/shop-product";

const SHOP_PRODUCTS_RAW: Array<
  Pick<ShopProduct, "id" | "slug" | "title" | "description" | "format" | "priceMinor">
> = [
  {
    id: "shop-patagonia-guide",
    slug: "patagonia-pdf-guide",
    title: "PDF-путеводитель: Патагония",
    description:
      "Маршруты, сезоны, снаряжение для треккинга и практические советы по Эль-Калафате, Чалтен и Ушуайе.",
    priceMinor: 1900,
    format: "PDF, 48 страниц",
  },
  {
    id: "shop-ba-guide",
    slug: "buenos-aires-city-guide",
    title: "Гид по Буэнос-Айресу",
    description:
      "Районы, milonga для начинающих, asado и безопасные маршруты на 3–5 дней в столице.",
    priceMinor: 1500,
    format: "PDF, 36 страниц",
  },
  {
    id: "shop-immigration-checklist",
    slug: "immigration-checklist",
    title: "Список документов для въезда",
    description:
      "Список документов, сроки, ссылки на Migraciones и типичные ошибки перед поездкой в Аргентину.",
    priceMinor: 900,
    format: "PDF, 12 страниц",
  },
  {
    id: "shop-wine-guide",
    slug: "mendoza-wine-guide",
    title: "Винный гид Мендосы",
    description:
      "Bodegas, регионы Uco Valley и Luján de Cuyo, дегустации и логистика винных туров.",
    priceMinor: 1400,
    format: "PDF, 32 страниц",
  },
  {
    id: "shop-northwest-guide",
    slug: "salta-northwest-guide",
    title: "Северо-запад: Сальта и Кафаяте",
    description:
      "Каньоны, солончаки, высоты и автомаршруты по провинции Сальта и Жужуй.",
    priceMinor: 1600,
    format: "PDF, 40 страниц",
  },
  {
    id: "shop-family-checklist",
    slug: "family-travel-checklist",
    title: "Список для семейной поездки",
    description:
      "Документы детей, медицина, страховка, развлечения и подбор туров для семей с детьми.",
    priceMinor: 700,
    format: "PDF, 10 страниц",
  },
];

export const SHOP_PRODUCTS: ShopProduct[] = SHOP_PRODUCTS_RAW.map((product) => ({
  ...product,
  image: getShopProductImage(product.id),
  imageAlt: getShopProductAlt(product.id),
  images: [{ url: getShopProductImage(product.id), alt: getShopProductAlt(product.id) }],
  categoryId: null,
  categoryName: "Цифровые гиды",
  currency: "USD",
  deliveryType: "digital",
  availability: "unlimited",
  stockQuantity: null,
  status: "published",
  seoTitle: product.title,
  seoDescription: product.description,
  version: 1,
  publishedAt: null,
  archivedAt: null,
  updatedAt: "",
}));

export function getShopProductBySlug(slug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((product) => product.slug === slug);
}
