import { getShopProductImage } from "@/lib/media-resolver";

export type ShopProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: "USD";
  deliveryType: "digital";
  image: string;
  format: string;
  /** Supabase Storage path for future signed PDF delivery */
  storagePath?: string;
};

const SHOP_PRODUCTS_RAW: Omit<ShopProduct, "image">[] = [
  {
    id: "shop-patagonia-guide",
    slug: "patagonia-pdf-guide",
    title: "PDF-путеводитель: Патагония",
    description:
      "Маршруты, сезоны, снаряжение для треккинга и практические советы по Эль-Калафате, Чалтен и Ушуайе.",
    price: 19,
    currency: "USD",
    deliveryType: "digital",
    format: "PDF, 48 страниц",
  },
  {
    id: "shop-ba-guide",
    slug: "buenos-aires-city-guide",
    title: "Гид по Буэнос-Айресу",
    description:
      "Районы, milonga для начинающих, asado и безопасные маршруты на 3–5 дней в столице.",
    price: 15,
    currency: "USD",
    deliveryType: "digital",
    format: "PDF, 36 страниц",
  },
  {
    id: "shop-immigration-checklist",
    slug: "immigration-checklist",
    title: "Список документов для въезда",
    description:
      "Список документов, сроки, ссылки на Migraciones и типичные ошибки перед поездкой в Аргентину.",
    price: 9,
    currency: "USD",
    deliveryType: "digital",
    format: "PDF, 12 страниц",
  },
  {
    id: "shop-wine-guide",
    slug: "mendoza-wine-guide",
    title: "Винный гид Мендосы",
    description:
      "Bodegas, регионы Uco Valley и Luján de Cuyo, дегустации и логистика винных туров.",
    price: 14,
    currency: "USD",
    deliveryType: "digital",
    format: "PDF, 32 страниц",
  },
  {
    id: "shop-northwest-guide",
    slug: "salta-northwest-guide",
    title: "Северо-запад: Сальта и Кафаяте",
    description:
      "Каньоны, солончаки, высоты и автомаршруты по провинции Сальта и Жужуй.",
    price: 16,
    currency: "USD",
    deliveryType: "digital",
    format: "PDF, 40 страниц",
  },
  {
    id: "shop-family-checklist",
    slug: "family-travel-checklist",
    title: "Список для семейной поездки",
    description:
      "Документы детей, медицина, страховка, развлечения и подбор туров для семей с детьми.",
    price: 7,
    currency: "USD",
    deliveryType: "digital",
    format: "PDF, 10 страниц",
  },
];

export const SHOP_PRODUCTS: ShopProduct[] = SHOP_PRODUCTS_RAW.map((product) => ({
  ...product,
  image: getShopProductImage(product.id),
}));

export function getShopProductBySlug(slug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((product) => product.slug === slug);
}
