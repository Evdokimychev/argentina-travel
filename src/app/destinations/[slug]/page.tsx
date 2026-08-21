import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DestinationDetailView from "@/components/destinations/DestinationDetailView";
import CmsContentSections from "@/components/content/CmsContentSections";
import SocialFeed from "@/components/social-feed/SocialFeed";
import DestinationFlightSidebar from "@/components/flights/DestinationFlightSidebar";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import FlightOffersJsonLd from "@/components/seo/FlightOffersJsonLd";
import TouristDestinationJsonLd from "@/components/seo/TouristDestinationJsonLd";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import {
  listPublishedDestinationSlugs,
  resolveDestinationPage,
} from "@/lib/cms/destination-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { fetchMarketplaceToursSafely } from "@/data/marketplace-tours-server";
import { getDestinationFlightTeasers } from "@/lib/flights/hub-price-teasers";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveKnowledgeLinksForDestination } from "@/lib/knowledge-internal-links";
import { buildCmsPageMetadata } from "@/lib/cms/cms-page-metadata";
import { filterToursWithResolvedPublicDetail } from "@/lib/public-tour-resolver";
import { matchToursForDestination } from "@/lib/destinations";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedDestinationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const destination = await resolveDestinationPage(slug, locale);
  if (!destination) return { title: "Направление" };

  const alternates = await buildCmsContentHreflangAlternates("destination", slug, locale);
  const title = `${destination.name} — направления Аргентины`;
  const description = `Путеводитель по направлению «${destination.name}»: ${
    destination.description ?? destination.intro
  }`;
  return buildCmsPageMetadata({
    content: destination,
    title,
    description,
    path: `/destinations/${slug}`,
    image: destination.image,
    alternates,
  });
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const destination = await resolveDestinationPage(slug, locale);
  if (!destination) notFound();
  const cmsMetadata = getCmsResolverMetadata(destination);

  const [{ tours: marketplaceTours, catalogUnavailable }, flightTeasers] = await Promise.all([
    fetchMarketplaceToursSafely("destination_detail_marketplace", { deadlineMs: 1_200 }),
    getDestinationFlightTeasers(destination.id, locale),
  ]);
  const tourCandidates = matchToursForDestination(marketplaceTours, destination).slice(0, 6);
  const tours = await filterToursWithResolvedPublicDetail(tourCandidates);
  const knowledgeLinks = resolveKnowledgeLinksForDestination(destination.id);

  return (
    <>
      {cmsMetadata?.showTranslationBanner ? (
        <TranslationPreparingBanner locale={cmsMetadata.requestedLocale} />
      ) : null}
      <BreadcrumbListJsonLd
        items={buildDetailBreadcrumbItems(locale, "destinations", {
          name: destination.name,
          path: `/destinations/${slug}`,
        })}
      />
      <TouristDestinationJsonLd destination={destination} />
      {flightTeasers.length > 0 ? (
        <FlightOffersJsonLd teasers={flightTeasers} pageUrl={`/destinations/${slug}`} />
      ) : null}
      <DestinationDetailView
        destination={destination}
        initialTours={tours}
        catalogUnavailable={catalogUnavailable}
        knowledgeLinks={knowledgeLinks}
        flightSidebar={
          <DestinationFlightSidebar
            destinationId={destination.id}
            destinationName={destination.name}
            locale={locale}
          />
        }
        cmsSections={<CmsContentSections sections={destination.sections} />}
      />
      <SocialFeed placement={`destination:${destination.id}`} compact />
    </>
  );
}
