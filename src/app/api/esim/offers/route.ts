import { NextResponse } from "next/server";
import { DEFAULT_ESIM_COUNTRY_ID, getEsimCountryById } from "@/data/esim-countries";
import { getAiraloAffiliateHomeUrl, resolveCountryAffiliateUrl } from "@/lib/airalo/affiliate";
import { getEsimOffers } from "@/lib/airalo/catalog";
import { isAiraloFeedConfigured } from "@/lib/airalo/env";
import { resolveLocaleFromParam } from "@/lib/airalo/locale-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryId = searchParams.get("country")?.trim() || DEFAULT_ESIM_COUNTRY_ID;
  const locale = resolveLocaleFromParam(searchParams.get("locale"));
  const country = getEsimCountryById(countryId) ?? getEsimCountryById(DEFAULT_ESIM_COUNTRY_ID)!;
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "500", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : undefined;

  const result = await getEsimOffers({
    countrySlug: country.slug,
    keywords: country.keywords,
    limit,
  });

  const partnerHomeUrl = getAiraloAffiliateHomeUrl() ?? undefined;
  const countryAffiliateUrl = await resolveCountryAffiliateUrl({
    countryId: country.id,
    countrySlug: country.slug,
    locale,
  });

  return NextResponse.json({
    ...result,
    country: {
      id: country.id,
      slug: country.slug,
      nameKey: country.nameKey,
    },
    feedConfigured: isAiraloFeedConfigured(),
    partnerHomeUrl,
    countryAffiliateUrl,
  });
}
