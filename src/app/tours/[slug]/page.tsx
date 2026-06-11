import TourDetailView from "@/components/tour-detail/TourDetailView";
import TourJsonLd from "@/components/seo/TourJsonLd";
import { fetchTourDetail, fetchSimilarTours } from "@/lib/tours";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";
import { baseTours } from "@/data/tours";

interface TourPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return baseTours.map((tour) => ({ slug: tour.slug }));
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
  const initialCanonicalTour = getCanonicalTourBySlug(slug) ?? null;

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
