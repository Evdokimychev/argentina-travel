import { NextResponse } from "next/server";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createSputnik8AffiliateLink,
  createTripsterAffiliateLink,
  isTravelpayoutsConfigured,
  TravelpayoutsError,
} from "@/lib/travelpayouts";
import {
  fetchExperienceForAffiliate,
  logAffiliateClick,
  updateExperiencePartnerUrl,
} from "@/lib/tripster/repository";
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

  let partnerUrl = experience.partner_url?.trim() || null;

  if (!partnerUrl) {
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
