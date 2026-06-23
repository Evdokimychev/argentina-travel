import "server-only";

import { fetchSputnik8Product } from "@/lib/sputnik8/client";
import { isSputnik8Configured } from "@/lib/sputnik8/env";
import {
  mergeSputnik8ProductSources,
  productNeedsDetailEnrichment,
} from "@/lib/sputnik8/excursion-payload";
import { rowToExcursionDetail } from "@/lib/sputnik8/mapper";
import type { Sputnik8Product } from "@/lib/sputnik8/types";
import type { ExcursionDetail } from "@/types/excursion";

type ProductRow = Parameters<typeof rowToExcursionDetail>[0];
type CityRow = Parameters<typeof rowToExcursionDetail>[1];

export async function enrichSputnik8ExcursionDetail(
  detail: ExcursionDetail,
  productId: number,
  payload: unknown,
  city?: CityRow | null
): Promise<ExcursionDetail> {
  let product = payload as Sputnik8Product | undefined;
  if (!product) return detail;

  if (productNeedsDetailEnrichment(product) && isSputnik8Configured()) {
    try {
      const live = await fetchSputnik8Product(productId);
      product = mergeSputnik8ProductSources(product, live);
    } catch {
      // keep stored payload
    }
  }

  if (product === payload) {
    return detail;
  }

  const row: ProductRow = {
    id: productId,
    slug: detail.slug,
    country_id: 0,
    city_id: detail.cityId,
    title: detail.title,
    tagline: detail.tagline ?? null,
    annotation: detail.annotation ?? null,
    description: detail.description ?? null,
    status: "active",
    experience_type: detail.experienceType ?? null,
    format: detail.format ?? null,
    duration_minutes: detail.durationMinutes ?? null,
    rating: detail.rating ?? null,
    review_count: detail.reviewCount,
    price_value: detail.priceValue ?? null,
    price_currency: detail.priceCurrency ?? null,
    price_display: detail.priceDisplay ?? null,
    sputnik8_url: detail.partnerUrl,
    partner_url: detail.partnerUrl,
    cover_image: detail.coverImage ?? null,
    photos: detail.photos,
    payload: product,
  };

  const enriched = rowToExcursionDetail(row, city ?? null);
  const reviews =
    detail.reviews && detail.reviews.length > 0
      ? detail.reviews
      : enriched.reviews && enriched.reviews.length > 0
        ? enriched.reviews
        : detail.reviews;

  return { ...enriched, reviews };
}
