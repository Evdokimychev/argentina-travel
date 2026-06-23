import { NextResponse } from "next/server";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createSputnik8AffiliateLink,
  createTripsterAffiliateLink,
  createYouTravelAffiliateLink,
  isTravelpayoutsConfigured,
  TravelpayoutsError,
} from "@/lib/travelpayouts";
import {
  fetchExperienceForAffiliate,
  logAffiliateClick,
  updateExperiencePartnerUrl,
} from "@/lib/tripster/repository";
import {
  buildYouTravelPartnerBookingUrl,
} from "@/lib/youtravel/partner-tour-utils";
import { buildTripsterPartnerBookingUrl } from "@/lib/tripster/partner-tour-utils";
import {
  fetchSputnik8ProductForAffiliate,
  logSputnik8AffiliateClick,
  updateSputnik8ProductPartnerUrl,
} from "@/lib/sputnik8/repository";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = slug?.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const parsed = parseExcursionSlug(normalizedSlug);
  const supabase = createSupabaseAdminClient();

  if (parsed?.partner === "youtravel") {
    const { data: tour } = await supabase
      .from("youtravel_tours")
      .select("id, slug, youtravel_url, partner_url, country")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    const requestUrl = new URL(request.url);
    const startDate = requestUrl.searchParams.get("start_date");
    const endDate = requestUrl.searchParams.get("end_date");
    const guestsRaw = requestUrl.searchParams.get("guests");
    const guests = guestsRaw ? Number.parseInt(guestsRaw, 10) : null;
    const customerName = requestUrl.searchParams.get("name");
    const customerEmail = requestUrl.searchParams.get("email");
    const customerPhone = requestUrl.searchParams.get("phone");
    const offerIdRaw = requestUrl.searchParams.get("offer_id");
    const offerId = offerIdRaw ? Number.parseInt(offerIdRaw, 10) : null;
    const wantsBookingDeepLink = Boolean(
      startDate || endDate || (guests != null && guests > 0) || offerId
    );

    let partnerUrl = tour.partner_url?.trim() || null;

    if (wantsBookingDeepLink) {
      const bookingTarget = buildYouTravelPartnerBookingUrl(tour.id, {
        tourSlug: tour.slug,
        startDate,
        endDate,
        guests: Number.isFinite(guests) ? guests : null,
        fallbackUrl: tour.youtravel_url,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        offerId: Number.isFinite(offerId) ? offerId : null,
      });

      if (isTravelpayoutsConfigured()) {
        try {
          const link = await createYouTravelAffiliateLink({
            youtravelUrl: bookingTarget,
            tourId: tour.id,
            country: tour.country ?? undefined,
          });
          partnerUrl = link.partnerUrl || link.url;
        } catch {
          partnerUrl = bookingTarget;
        }
      } else {
        partnerUrl = bookingTarget;
      }
    } else if (!partnerUrl) {
      if (!isTravelpayoutsConfigured()) {
        partnerUrl = tour.youtravel_url;
      } else {
        try {
          const link = await createYouTravelAffiliateLink({
            youtravelUrl: tour.youtravel_url,
            tourId: tour.id,
            country: tour.country ?? undefined,
          });
          partnerUrl = link.partnerUrl || link.url;
          if (partnerUrl) {
            await supabase
              .from("youtravel_tours")
              .update({ partner_url: partnerUrl })
              .eq("id", tour.id);
          }
        } catch (error) {
          const message =
            error instanceof TravelpayoutsError
              ? error.message
              : "Failed to generate affiliate link";
          return NextResponse.json({ error: message }, { status: 500 });
        }
      }
    }

    if (!partnerUrl) {
      return NextResponse.json({ error: "Partner URL unavailable" }, { status: 500 });
    }

    return NextResponse.redirect(partnerUrl, 302);
  }

  if (parsed?.partner === "sputnik8") {
    const product = await fetchSputnik8ProductForAffiliate(supabase, normalizedSlug);
    if (!product) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    let partnerUrl = product.partner_url?.trim() || null;

    if (!partnerUrl) {
      if (!isTravelpayoutsConfigured()) {
        return NextResponse.json({ error: "Affiliate link is not available" }, { status: 503 });
      }

      try {
        const { data: city } = await supabase
          .from("sputnik8_cities")
          .select("slug")
          .eq("id", product.city_id)
          .maybeSingle();

        const link = await createSputnik8AffiliateLink({
          sputnik8Url: product.sputnik8_url,
          productId: product.id,
          citySlug: city?.slug,
        });

        partnerUrl = link.partnerUrl || link.url;
        if (partnerUrl) {
          await updateSputnik8ProductPartnerUrl(supabase, product.id, partnerUrl);
        }
      } catch (error) {
        const message =
          error instanceof TravelpayoutsError
            ? error.message
            : "Failed to generate affiliate link";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    if (!partnerUrl) {
      return NextResponse.json({ error: "Partner URL unavailable" }, { status: 500 });
    }

    const referer = request.headers.get("referer") ?? undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await logSputnik8AffiliateClick(supabase, {
      productId: product.id,
      experienceSlug: normalizedSlug,
      partnerUrl,
      referer,
      userAgent,
    });

    return NextResponse.redirect(partnerUrl, 302);
  }

  const experience = await fetchExperienceForAffiliate(supabase, normalizedSlug);

  if (!experience) {
    const excursion = await fetchExcursionDetailServer(normalizedSlug);
    if (excursion?.partner === "sputnik8" && excursion.partnerUrl) {
      return NextResponse.redirect(excursion.partnerUrl, 302);
    }
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const startDate = requestUrl.searchParams.get("start_date");
  const slotTime = requestUrl.searchParams.get("time");
  const guestsRaw = requestUrl.searchParams.get("guests");
  const guests = guestsRaw ? Number.parseInt(guestsRaw, 10) : null;
  const customerName = requestUrl.searchParams.get("name");
  const customerEmail = requestUrl.searchParams.get("email");
  const customerPhone = requestUrl.searchParams.get("phone");
  const wantsBookingDeepLink = Boolean(startDate || slotTime || (guests != null && guests > 0));

  let partnerUrl = experience.partner_url?.trim() || null;

  if (wantsBookingDeepLink) {
    const bookingTarget = buildTripsterPartnerBookingUrl(experience.id, {
      startDate,
      time: slotTime,
      guests: Number.isFinite(guests) ? guests : null,
      fallbackUrl: experience.tripster_url,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    });

    if (isTravelpayoutsConfigured()) {
      try {
        const { data: city } = await supabase
          .from("tripster_cities")
          .select("slug")
          .eq("id", experience.city_id)
          .maybeSingle();

        const link = await createTripsterAffiliateLink({
          tripsterUrl: bookingTarget,
          experienceId: experience.id,
          citySlug: city?.slug,
        });

        partnerUrl = link.partnerUrl || link.url;
      } catch {
        partnerUrl = bookingTarget;
      }
    } else {
      partnerUrl = bookingTarget;
    }
  } else if (!partnerUrl) {
    if (!isTravelpayoutsConfigured()) {
      return NextResponse.json({ error: "Affiliate link is not available" }, { status: 503 });
    }

    try {
      const { data: city } = await supabase
        .from("tripster_cities")
        .select("slug")
        .eq("id", experience.city_id)
        .maybeSingle();

      const link = await createTripsterAffiliateLink({
        tripsterUrl: experience.tripster_url,
        experienceId: experience.id,
        citySlug: city?.slug,
      });

      partnerUrl = link.partnerUrl || link.url;
      if (partnerUrl) {
        await updateExperiencePartnerUrl(supabase, experience.id, partnerUrl);
      }
    } catch (error) {
      const message =
        error instanceof TravelpayoutsError
          ? error.message
          : "Failed to generate affiliate link";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!partnerUrl) {
    return NextResponse.json({ error: "Partner URL unavailable" }, { status: 500 });
  }

  const referer = request.headers.get("referer") ?? undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  await logAffiliateClick(supabase, {
    experienceId: experience.id,
    experienceSlug: normalizedSlug,
    partnerUrl,
    referer,
    userAgent,
  });

  return NextResponse.redirect(partnerUrl, 302);
}
