import { NextResponse } from "next/server";
import { DEFAULT_ESIM_COUNTRY_ID, getEsimCountryById } from "@/data/esim-countries";
import {
  buildAiraloCountryLandingUrl,
  createEsimAffiliateRedirectUrl,
  getAiraloAffiliateHomeUrl,
  logEsimAffiliateClick,
} from "@/lib/airalo/affiliate";
import { resolveEsimOfferBookingUrl } from "@/lib/airalo/booking-url";
import { getEsimOfferById } from "@/lib/airalo/catalog";
import { resolveLocaleFromParam } from "@/lib/airalo/locale-url";
import { isTravelpayoutsConfigured, TravelpayoutsError } from "@/lib/travelpayouts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offerId = searchParams.get("offerId")?.trim() ?? "";
  const countryId = searchParams.get("country")?.trim() || DEFAULT_ESIM_COUNTRY_ID;
  const locale = resolveLocaleFromParam(searchParams.get("locale"));
  const country = getEsimCountryById(countryId) ?? getEsimCountryById(DEFAULT_ESIM_COUNTRY_ID)!;

  if (offerId) {
    const offer = await getEsimOfferById(offerId);
    if (offer) {
      const partnerUrl = await resolveEsimOfferBookingUrl({
        offer,
        countrySlug: country.slug,
        locale,
      });
      const resolvedOfferId = offer.planSlug ? `${offer.id}:${offer.planSlug}` : offer.id;

      await logEsimAffiliateClick({
        offerId: resolvedOfferId,
        countrySlug: country.slug,
        partnerUrl,
        referer: request.headers.get("referer") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });

      return NextResponse.redirect(partnerUrl, 302);
    }
  }

  let airaloUrl = searchParams.get("url")?.trim() ?? "";
  let resolvedOfferId = offerId || "country";

  if (!airaloUrl) {
    const homeUrl = getAiraloAffiliateHomeUrl();
    if (homeUrl && country.id === "global") {
      await logEsimAffiliateClick({
        offerId: resolvedOfferId,
        countrySlug: country.slug,
        partnerUrl: homeUrl,
        referer: request.headers.get("referer") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return NextResponse.redirect(homeUrl, 302);
    }

    airaloUrl = buildAiraloCountryLandingUrl(country.slug, locale);
    resolvedOfferId = `country-${country.id}`;
  }

  if (!isTravelpayoutsConfigured()) {
    await logEsimAffiliateClick({
      offerId: resolvedOfferId,
      countrySlug: country.slug,
      partnerUrl: airaloUrl,
      referer: request.headers.get("referer") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.redirect(airaloUrl, 302);
  }

  try {
    const partnerUrl = await createEsimAffiliateRedirectUrl({
      airaloUrl,
      offerId: resolvedOfferId,
      countrySlug: country.slug,
    });

    await logEsimAffiliateClick({
      offerId: resolvedOfferId,
      countrySlug: country.slug,
      partnerUrl,
      referer: request.headers.get("referer") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.redirect(partnerUrl, 302);
  } catch (error) {
    const message =
      error instanceof TravelpayoutsError ? error.message : "Failed to generate affiliate link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
