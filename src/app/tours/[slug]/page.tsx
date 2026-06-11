import TourDetailView from "@/components/tour-detail/TourDetailView";
import TourJsonLd from "@/components/seo/TourJsonLd";
import { fetchTourDetail, fetchSimilarTours } from "@/lib/tours-server";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { fetchCanonicalTourBySlugServer } from "@/lib/tour-content-server";
import { baseTours } from "@/data/tours";

interface TourPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const staticSlugs = baseTours.map((tour) => tour.slug);

  if (isSupabaseToursEnabled()) {
    try {
      const { fetchPublishedSlugsServer } = await import("@/lib/tour-content-server");
      const dbSlugs = await fetchPublishedSlugsServer();
      const merged = new Set([...staticSlugs, ...dbSlugs]);
      return Array.from(merged).map((slug) => ({ slug }));
    } catch {
      // use static slugs only
    }
  }

  return staticSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = await fetchTourDetail(slug);
  if (!tour) return { title: "Тур не найден" };
  return {
    title: `${tour.title} — тур по Аргентине`,
    description: tour.shortDescription,
    openGraph: {
      title: tour.title,
      description: tour.shortDescription,
      images: tour.gallery.length ? [tour.image] : undefined,
      type: "website",
    },
    alternates: {
      canonical: `/tours/${slug}`,
    },
  };
}

export default async function TourDetailPage({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = await fetchTourDetail(slug);
  const similarTours = tour ? await fetchSimilarTours(slug, 3) : [];
  let initialCanonicalTour = getCanonicalTourBySlug(slug) ?? null;

  if (!initialCanonicalTour && isSupabaseToursEnabled()) {
    try {
      initialCanonicalTour = await fetchCanonicalTourBySlugServer(slug);
    } catch {
      // keep null
    }
  }

  return (
    <>
      {tour ? <TourJsonLd tour={tour} /> : null}
      <TourDetailView
        slug={slug}
        tour={tour}
        similarTours={similarTours}
        initialCanonicalTour={initialCanonicalTour}
      />
    </>
  );
}
