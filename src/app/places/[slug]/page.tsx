import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import PlaceDetailView from "@/components/places/PlaceDetailView";
import CmsContentSections from "@/components/content/CmsContentSections";
import SocialFeed from "@/components/social-feed/SocialFeed";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import PlaceJsonLd from "@/components/seo/PlaceJsonLd";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { resolveKnowledgeLinksForPlace } from "@/lib/knowledge-internal-links";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { placeHref } from "@/lib/places-urls";
import { listPublishedPlaceSlugs, resolvePlacePage } from "@/lib/cms/place-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildCmsPageMetadata } from "@/lib/cms/cms-page-metadata";
import { getPlaceCoverAlt, getPlaceGalleryAlts } from "@/lib/media-resolver";
import { resolveRelatedToursForPlace } from "@/lib/cms-content-cross-links";
import { filterToursWithResolvedPublicDetail } from "@/lib/public-tour-resolver";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedPlaceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const place = await resolvePlacePage(slug, locale);
  if (!place) return { title: "Место не найдено" };
  const alternates = await buildCmsContentHreflangAlternates("place", slug, locale);
  return buildCmsPageMetadata({
    content: place,
    title: `${place.name} — места Аргентины`,
    description: `Путеводитель по месту «${place.name}»: ${place.shortDescription}`,
    path: placeHref(place.slug),
    image: place.coverImage,
    alternates,
  });
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const place = await resolvePlacePage(slug, locale);
  if (!place) notFound();
  const cmsMetadata = getCmsResolverMetadata(place);

  const knowledgeLinks = resolveKnowledgeLinksForPlace(slug);
  const marketplaceTours = await fetchMarketplaceTours();
  const tourCandidates = resolveRelatedToursForPlace(place, marketplaceTours);
  const relatedTours = await filterToursWithResolvedPublicDetail(tourCandidates);

  return (
    <>
      {cmsMetadata?.showTranslationBanner ? (
        <TranslationPreparingBanner locale={cmsMetadata.requestedLocale} />
      ) : null}
      <BreadcrumbListJsonLd
        items={buildDetailBreadcrumbItems(locale, "places", {
          name: place.name,
          path: placeHref(slug),
        })}
      />
      <PlaceJsonLd place={place} />
      {place.faq && place.faq.length > 0 ? (
        <FAQPageJsonLd questions={place.faq} path={placeHref(slug)} />
      ) : null}
      <PlaceDetailView
        place={place}
        knowledgeLinks={knowledgeLinks}
        initialTours={relatedTours}
        coverImageAlt={getPlaceCoverAlt(place.slug)}
        galleryAlts={getPlaceGalleryAlts(place.slug)}
        cmsSections={<CmsContentSections sections={place.sections} />}
      />
      <SocialFeed placement={`place:${slug}`} compact />
    </>
  );
}
