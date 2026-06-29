import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceHome from "@/components/marketplace/MarketplaceHome";
import HomeHeroCollage from "@/components/marketplace/HomeHeroCollage";
import TravelPrepStrip from "@/components/flights/TravelPrepStrip";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { blogPosts } from "@/data/blog";
import { collectTopVerifiedReviewsAsync } from "@/lib/homepage-reviews";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getPlatformStatsFromMarketplace } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getFlag } from "@/lib/feature-flags/server";
import { resolveInteractionActor } from "@/lib/personalization/interaction-context-server";
import {
  getRecommendedExcursions,
  getRecommendedTours,
} from "@/lib/personalization/recommendations-server";
import { fetchExcursionCitiesServer } from "@/lib/tripster/excursion-server";
import { getHomeHeroAlt, getHomeHeroImage, getHomeShowcaseImages } from "@/lib/media-resolver";
import { absoluteUrl } from "@/lib/site-url";

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

  const tours = await fetchMarketplaceTours();
  const heroSrc = getHomeHeroImage();
  const platformStats = getPlatformStatsFromMarketplace(tours);

  const [testimonials, recommendedTours, recommendedExcursions, excursionCities] =
    await Promise.all([
      collectTopVerifiedReviewsAsync(3),
      homepageRecommendationsV2Enabled
        ? getRecommendedTours({ ...actor, limit: 6, allTours: tours })
        : Promise.resolve({ tours: [], personalized: false }),
      homepageRecommendationsV2Enabled
        ? getRecommendedExcursions({ ...actor, limit: 6 })
        : Promise.resolve({ excursions: [], personalized: false }),
      fetchExcursionCitiesServer(),
    ]);

  return (
    <>
      <link rel="preload" as="image" href={absoluteUrl(heroSrc)} fetchPriority="high" />
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/" />
      <MarketplaceHome
        tours={tours}
        blogPosts={blogPosts}
        testimonials={testimonials}
        platformStats={platformStats}
        excursionCities={excursionCities}
        travelPrepStrip={
          <Suspense fallback={null}>
            <TravelPrepStrip />
          </Suspense>
        }
        heroCollage={
          <HomeHeroCollage
            heroSrc={heroSrc}
            heroAlt={getHomeHeroAlt()}
            showcase={getHomeShowcaseImages()}
          />
        }
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
