import type {
  ShopProduct,
  ShopProductAvailability,
  ShopProductDeliveryType,
  ShopProductImage,
  ShopProductStatus,
} from "@/types/shop-product";

export type AdminShopCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  version: number;
  updatedAt: string;
  productCount: number;
};

export type ShopProductDraft = Pick<
  ShopProduct,
  | "categoryId"
  | "slug"
  | "title"
  | "description"
  | "deliveryType"
  | "priceMinor"
  | "currency"
  | "availability"
  | "stockQuantity"
  | "status"
  | "seoTitle"
  | "seoDescription"
  | "images"
> & { format: string };

export type ShopCategoryDraft = {
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

const SLUG = /^[a-z0-9][a-z0-9-]{1,119}$/;
const CATEGORY_SLUG = /^[a-z0-9][a-z0-9-]{1,79}$/;
const CURRENCY = /^[A-Z]{3}$/;
const DELIVERY: ShopProductDeliveryType[] = ["digital", "physical", "service"];
const AVAILABILITY: ShopProductAvailability[] = [
  "unlimited",
  "in_stock",
  "out_of_stock",
  "preorder",
];
const STATUSES: ShopProductStatus[] = ["draft", "published", "archived"];

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length <= max ? normalized : null;
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  return text(value, max) ?? undefined;
}

function validImage(value: unknown): ShopProductImage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const url = text(candidate.url, 2048);
  const alt = text(candidate.alt, 300);
  if (!url || !alt || alt.length < 2) return null;
  if (!url.startsWith("/media/") && !/^https:\/\/([a-z0-9-]+\.)*(supabase\.co|goargentina\.ru)\//i.test(url)) {
    return null;
  }
  return { url, alt };
}

export function slugifyShopValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function validateShopProductDraft(
  value: unknown,
): { ok: true; value: ShopProductDraft } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Заполните карточку товара" };
  const body = value as Record<string, unknown>;
  const title = text(body.title, 160);
  const slug = text(body.slug, 120)?.toLowerCase() ?? null;
  const description = text(body.description, 10000);
  const format = text(body.format, 160);
  const currency = text(body.currency, 3)?.toUpperCase() ?? null;
  const seoTitle = optionalText(body.seoTitle, 70);
  const seoDescription = optionalText(body.seoDescription, 180);
  const parsedImages = Array.isArray(body.images) ? body.images.map(validImage) : [];
  const images = parsedImages.filter((image): image is ShopProductImage => image !== null);
  const priceMinor = body.priceMinor;
  const stockQuantity = body.stockQuantity;

  if (!title || title.length < 2) return { ok: false, error: "Укажите название товара" };
  if (!slug || !SLUG.test(slug)) return { ok: false, error: "Проверьте адрес товара" };
  if (description === null) return { ok: false, error: "Описание слишком длинное" };
  if (format === null) return { ok: false, error: "Формат слишком длинный" };
  if (typeof body.categoryId !== "string" || !body.categoryId) {
    return { ok: false, error: "Выберите категорию" };
  }
  if (!Number.isSafeInteger(priceMinor) || (priceMinor as number) < 0) {
    return { ok: false, error: "Цена должна быть целым числом в минимальных единицах валюты" };
  }
  if (!currency || !CURRENCY.test(currency)) return { ok: false, error: "Проверьте валюту" };
  if (!DELIVERY.includes(body.deliveryType as ShopProductDeliveryType)) {
    return { ok: false, error: "Выберите тип доставки" };
  }
  if (!AVAILABILITY.includes(body.availability as ShopProductAvailability)) {
    return { ok: false, error: "Выберите доступность" };
  }
  if (!STATUSES.includes(body.status as ShopProductStatus) || body.status === "archived") {
    return { ok: false, error: "Архивация выполняется отдельным действием" };
  }
  if (images.length !== parsedImages.length || images.length > 8) {
    return { ok: false, error: "Проверьте изображения и подписи" };
  }
  if (seoTitle === undefined || seoDescription === undefined) {
    return { ok: false, error: "Проверьте SEO-заголовок и описание" };
  }

  let normalizedStock: number | null = null;
  if (body.availability !== "unlimited") {
    if (!Number.isSafeInteger(stockQuantity) || (stockQuantity as number) < 0) {
      return { ok: false, error: "Укажите остаток целым числом" };
    }
    normalizedStock = stockQuantity as number;
  }
  if (body.availability === "in_stock" && normalizedStock === 0) {
    return { ok: false, error: "Для статуса «В наличии» остаток должен быть больше нуля" };
  }
  if (body.availability === "out_of_stock" && normalizedStock !== 0) {
    return { ok: false, error: "Для статуса «Нет в наличии» остаток должен быть равен нулю" };
  }

  if (body.status === "published") {
    if (description.length < 20 || (format?.length ?? 0) < 2 || (priceMinor as number) <= 0) {
      return { ok: false, error: "Для публикации заполните описание, формат и цену" };
    }
    if (images.length === 0) return { ok: false, error: "Для публикации добавьте изображение с подписью" };
    if (!seoTitle || !seoDescription || seoDescription.length < 50) {
      return { ok: false, error: "Для публикации заполните SEO-заголовок и SEO-описание" };
    }
  }

  return {
    ok: true,
    value: {
      categoryId: body.categoryId,
      slug,
      title,
      description,
      format: format ?? "",
      deliveryType: body.deliveryType as ShopProductDeliveryType,
      priceMinor: priceMinor as number,
      currency,
      availability: body.availability as ShopProductAvailability,
      stockQuantity: normalizedStock,
      status: body.status as ShopProductStatus,
      seoTitle,
      seoDescription,
      images,
    },
  };
}

export function validateShopCategoryDraft(
  value: unknown,
): { ok: true; value: ShopCategoryDraft } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Заполните категорию" };
  const body = value as Record<string, unknown>;
  const slug = text(body.slug, 80)?.toLowerCase() ?? null;
  const name = text(body.name, 100);
  const description = optionalText(body.description, 1000);
  if (!slug || !CATEGORY_SLUG.test(slug)) return { ok: false, error: "Проверьте адрес категории" };
  if (!name || name.length < 2) return { ok: false, error: "Укажите название категории" };
  if (description === undefined) return { ok: false, error: "Описание категории слишком длинное" };
  if (!Number.isInteger(body.sortOrder) || (body.sortOrder as number) < 0 || (body.sortOrder as number) > 32767) {
    return { ok: false, error: "Проверьте порядок категории" };
  }
  return { ok: true, value: { slug, name, description, sortOrder: body.sortOrder as number } };
}

export function shopCatalogError(code?: string): { status: number; error: string } {
  const errors: Record<string, { status: number; error: string }> = {
    forbidden: { status: 403, error: "Нет доступа к управлению магазином" },
    not_found: { status: 404, error: "Товар или категория не найдены" },
    version_conflict: { status: 409, error: "Карточку уже изменили. Обновите страницу и повторите действие." },
    slug_conflict: { status: 409, error: "Такой адрес уже используется" },
    publish_requirements: { status: 400, error: "Перед публикацией заполните описание, цену, изображение и SEO-поля" },
    category_unavailable: { status: 400, error: "Выбранная категория недоступна" },
    category_has_published_products: { status: 409, error: "Сначала перенесите или снимите с публикации товары этой категории" },
    invalid_input: { status: 400, error: "Проверьте заполнение карточки" },
  };
  return errors[code ?? ""] ?? { status: 503, error: "Каталог временно недоступен. Попробуйте ещё раз." };
}
