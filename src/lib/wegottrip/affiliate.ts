import "server-only";

import {
  createTravelpayoutsPartnerLink,
  isTravelpayoutsConfigured,
  TravelpayoutsError,
} from "@/lib/travelpayouts/client";
import {
  buildWeGoTripCheckoutUrl,
  buildWeGoTripProductPageUrl,
} from "@/lib/wegottrip/client";
import type { WeGoTripProductSummary } from "@/lib/wegottrip/types";
import type { LocaleCode } from "@/types/locale";

export async function resolveWeGoTripAffiliateUrl(input: {
  product: Pick<WeGoTripProductSummary, "id" | "slug" | "city">;
  locale: LocaleCode;
  checkout?: boolean;
}): Promise<string> {
  const partnerUrl = input.checkout
    ? buildWeGoTripCheckoutUrl({ locale: input.locale, product: input.product })
    : buildWeGoTripProductPageUrl({
        locale: input.locale,
        city: input.product.city,
        product: input.product,
      });

  if (!isTravelpayoutsConfigured()) {
    return partnerUrl;
  }

  try {
    const link = await createTravelpayoutsPartnerLink({
      url: partnerUrl,
      subId: `wegottrip:${input.product.city.slug}:${input.product.id}`,
    });
    return link.partnerUrl?.trim() || link.url;
  } catch (error) {
    if (error instanceof TravelpayoutsError) {
      return partnerUrl;
    }
    throw error;
  }
}

export async function logWeGoTripAffiliateClick(input: {
  productId: number;
  citySlug: string;
  partnerUrl: string;
  referer?: string;
  userAgent?: string;
}) {
  if (process.env.NODE_ENV === "development") {
    console.info("[wegottrip-affiliate]", input);
  }
}
