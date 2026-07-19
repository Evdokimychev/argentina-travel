import { describe, expect, it } from "vitest";
import {
  shopCatalogError,
  slugifyShopValue,
  validateShopCategoryDraft,
  validateShopProductDraft,
} from "@/lib/admin/shop-catalog-contract";

const completeDraft = {
  categoryId: "fd4b97f3-bf16-46af-8b7c-5d55d2340761",
  slug: "patagonia-guide",
  title: "Гид по Патагонии",
  description: "Подробное описание маршрутов, сезонов и подготовки к путешествию.",
  format: "PDF, 48 страниц",
  deliveryType: "digital",
  priceMinor: 1900,
  currency: "usd",
  availability: "unlimited",
  stockQuantity: null,
  status: "published",
  seoTitle: "Гид по Патагонии",
  seoDescription: "Практический путеводитель по Патагонии с маршрутами, сезонами и советами для самостоятельной поездки.",
  images: [{ url: "/media/shop/patagonia.jpg", alt: "Горы Патагонии" }],
};

describe("shop catalog owner contracts", () => {
  it("accepts an exact minor-unit publication and normalizes currency", () => {
    const result = validateShopProductDraft(completeDraft);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.currency).toBe("USD");
  });

  it("rejects float money, invalid stock semantics and incomplete publication", () => {
    expect(validateShopProductDraft({ ...completeDraft, priceMinor: 19.5 }).ok).toBe(false);
    expect(validateShopProductDraft({ ...completeDraft, availability: "in_stock", stockQuantity: 0 }).ok).toBe(false);
    expect(validateShopProductDraft({ ...completeDraft, images: [] }).ok).toBe(false);
    expect(validateShopProductDraft({ ...completeDraft, seoDescription: "Коротко" }).ok).toBe(false);
  });

  it("allows incomplete draft content but not unsafe media URLs", () => {
    expect(validateShopProductDraft({
      ...completeDraft,
      status: "draft",
      description: "",
      format: "",
      priceMinor: 0,
      seoTitle: null,
      seoDescription: null,
      images: [],
    }).ok).toBe(true);
    expect(validateShopProductDraft({
      ...completeDraft,
      images: [{ url: "javascript:alert(1)", alt: "Опасное изображение" }],
    }).ok).toBe(false);
  });

  it("validates owner categories and produces stable slugs", () => {
    expect(slugifyShopValue("  Patagonia 2026! ")).toBe("patagonia-2026");
    expect(validateShopCategoryDraft({ slug: "digital-guides", name: "Цифровые гиды", description: "PDF", sortOrder: 10 }).ok).toBe(true);
    expect(validateShopCategoryDraft({ slug: "../bad", name: "Гиды", sortOrder: 10 }).ok).toBe(false);
  });

  it("maps concurrent updates to an explicit 409 without leaking database errors", () => {
    expect(shopCatalogError("version_conflict")).toEqual({
      status: 409,
      error: "Карточку уже изменили. Обновите страницу и повторите действие.",
    });
    expect(shopCatalogError("unknown").error).not.toMatch(/postgres|supabase|sql/i);
  });
});
