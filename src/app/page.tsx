import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceHome, {
  type MarketplaceHomeCatalogData,
} from "@/components/marketplace/MarketplaceHome";
import HomeHeroCollage from "@/components/marketplace/HomeHeroCollage";
import TravelPrepStrip from "@/components/flights/TravelPrepStrip";
import HomePrimarySectionsItemListJsonLd from "@/components/seo/HomePrimarySectionsItemListJsonLd";
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
  getRecommendedTours,
} from "@/lib/personalization/recommendations-server";
import { fetchExcursionCitiesServer } from "@/lib/tripster/excursion-server";
import { getHomeHeroAlt, getHomeHeroImage, getHomeShowcaseImages } from "@/lib/media-resolver";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";
import { getRecommendedListings } from "@/lib/tour-listing-ranking";
import type { Testimonial, TourListing } from "@/types";
import type { InteractionActor } from "@/lib/personalization/interactions-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";

const PAGE_TITLE = "Авторские туры по Аргентине — Патагония, Буэнос-Айрес, Мендоса";
const PAGE_DESCRIPTION =
  "Русскоязычные гиды, проверенные маршруты и путеводитель по стране: туры, иммиграция и практические советы для поездки.";

function selectHomeTourPayload(
  tours: TourListing[],
  personalized: TourListing[],
  limit = 30,
): TourListing[] {
  const homepageTours = filterArgentinaHomepageTours(tours);
  const hot = homepageTours.filter((tour) => tour.isHot).slice(0, 6);
  const youTravel = homepageTours
    .filter((tour) => tour.partnerSource === "youtravel")
    .slice(0, 8);
  const ranked = getRecommendedListings(homepageTours, 18);
  const unique = new Map<string, TourListing>();
  for (const tour of [...personalized, ...hot, ...youTravel, ...ranked, ...homepageTours]) {
    if (!unique.has(tour.slug)) unique.set(tour.slug, tour);
    if (unique.size >= limit) break;
  }
  return [...unique.values()];
}

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/",
  }),
  alternates: buildHreflangAlternates("/"),
};

async function loadMarketplaceHomeCatalogData(
  actorPromise: Promise<InteractionActor>,
  toursPromise: Promise<TourListing[]>,
): Promise<MarketplaceHomeCatalogData> {
  const flagPromise = actorPromise.then((actor) => {
    const actorId = actor.userId ?? actor.anonymousId ?? null;
    return getFlag("homepage_recommendations_v2", actorId);
  });

  const recommendationsPromise = Promise.all([
    actorPromise,
    toursPromise,
    flagPromise,
  ]).then(([actor, tours, enabled]) =>
    enabled
      ? getRecommendedTours({ ...actor, limit: 6, allTours: tours })
      : { tours: [], personalized: false },
  );

  const [tours, homepageRecommendationsV2Enabled, recommendedTours] =
    await Promise.all([toursPromise, flagPromise, recommendationsPromise]);

  const platformStats = getPlatformStatsFromMarketplace(tours);
  const homeTours = selectHomeTourPayload(tours, recommendedTours.tours);

  return {
    tours: homeTours,
    platformStats,
    showHomepageRecommendationsV2: homepageRecommendationsV2Enabled,
    personalizedTours: recommendedTours.tours,
    personalizedActive: recommendedTours.personalized,
  };
}

async function loadMarketplaceHomeTestimonials(): Promise<Testimonial[]> {
  return collectTopVerifiedReviewsAsync(3);
}

export default function HomePage() {
  // Start every independent source immediately. Suspense islands below consume
  // only the data they need, while these shared promises prevent duplicate work.
  const actorPromise = resolveInteractionActor();
  const toursPromise = fetchMarketplaceTours();
  const catalogData = loadMarketplaceHomeCatalogData(actorPromise, toursPromise);
  const testimonials = loadMarketplaceHomeTestimonials();
  const excursionCities = fetchExcursionCitiesServer();
  const navigation = fetchSiteNavigation();
  const heroSrc = getHomeHeroImage();

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/" />
      <HomePrimarySectionsItemListJsonLd />
      <MarketplaceHome
        catalogData={catalogData}
        navigation={navigation}
        blogPosts={blogPosts.slice(0, 3)}
        testimonials={testimonials}
        excursionCities={excursionCities}
        travelPrepStrip={
          <Suspense key="home-travel-prep-strip" fallback={null}>
            <TravelPrepStrip />
          </Suspense>
        }
        heroCollage={
          <HomeHeroCollage
            key="home-hero-collage"
            heroSrc={heroSrc}
            heroAlt={getHomeHeroAlt()}
            showcase={getHomeShowcaseImages()}
          />
        }
      />
    </>
  );
}
