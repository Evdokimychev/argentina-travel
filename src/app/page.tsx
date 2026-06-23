import type { Metadata } from "next";
import MarketplaceHome from "@/components/marketplace/MarketplaceHome";
import TravelPrepStrip from "@/components/flights/TravelPrepStrip";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { blogPosts } from "@/data/blog";
import { collectTopVerifiedReviewsAsync } from "@/lib/homepage-reviews";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getFlag } from "@/lib/feature-flags/server";
import { resolveInteractionActor } from "@/lib/personalization/interaction-context-server";
import {
  getRecommendedExcursions,
  getRecommendedTours,
} from "@/lib/personalization/recommendations-server";
import { fetchExcursionCitiesServer } from "@/lib/tripster/excursion-server";

const PAGE_TITLE = "Авторские туры по Аргентине — Патагония, Буэнос-Айрес, Мендоса";
const PAGE_DESCRIPTION =
  "Русскоязычные гиды, проверенные маршруты и путеводитель по стране: туры, иммиграция и практические советы для поездки.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/",
  }),
  alternates: buildHreflangAlternates("/"),
};

export default async function HomePage() {
  const actor = await resolveInteractionActor();
  const actorId = actor.userId ?? actor.anonymousId ?? null;
  const homepageRecommendationsV2Enabled = await getFlag(
    "homepage_recommendations_v2",
    actorId
  );

  const [tours, testimonials, platformStats, recommendedTours, recommendedExcursions, excursionCities] =
    await Promise.all([
      fetchMarketplaceTours(),
      collectTopVerifiedReviewsAsync(3),
      Promise.resolve(getPlatformStatsFromRepository()),
      homepageRecommendationsV2Enabled
        ? getRecommendedTours({ ...actor, limit: 6 })
        : Promise.resolve({ tours: [], personalized: false }),
      homepageRecommendationsV2Enabled
        ? getRecommendedExcursions({ ...actor, limit: 6 })
        : Promise.resolve({ excursions: [], personalized: false }),
      fetchExcursionCitiesServer(),
    ]);

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/" />
      <MarketplaceHome
        tours={tours}
        blogPosts={blogPosts}
        testimonials={testimonials}
        platformStats={platformStats}
        excursionCities={excursionCities}
        travelPrepStrip={<TravelPrepStrip />}
        showHomepageRecommendationsV2={homepageRecommendationsV2Enabled}
        personalizedTours={recommendedTours.tours}
        personalizedExcursions={recommendedExcursions.excursions}
        personalizedActive={
          recommendedTours.personalized || recommendedExcursions.personalized
        }
      />
    </>
  );
}
