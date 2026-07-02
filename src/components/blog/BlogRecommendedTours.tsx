import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import { BLOG_CATEGORY_TOUR_CTAS } from "@/data/blog-category-tours";
import { pickBlogIndexFeaturedTours } from "@/lib/blog-index-tours";
import { cn } from "@/lib/cn";
import type { TourListing } from "@/types";

const FEATURED_TOUR_LINKS = [
  BLOG_CATEGORY_TOUR_CTAS["Патагония"],
  BLOG_CATEGORY_TOUR_CTAS["Буэнос-Айрес"],
  BLOG_CATEGORY_TOUR_CTAS["Водопады Игуасу"],
  BLOG_CATEGORY_TOUR_CTAS["Винодельни"],
].filter(Boolean);

type BlogRecommendedToursProps = {
  className?: string;
  initialTours?: TourListing[];
};

export default function BlogRecommendedTours({
  className,
  initialTours = [],
}: BlogRecommendedToursProps) {
  const liveTours = pickBlogIndexFeaturedTours(initialTours, 4);

  return (
    <section className={cn(className)} aria-labelledby="blog-recommended-tours-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="blog-recommended-tours-title"
            className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
          >
            Рекомендуемые туры
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate">
            Авторские маршруты от организаторов — дополнение к материалам журнала
          </p>
        </div>
        <Link
          href="/tours"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sky-ink hover:underline"
        >
          Весь каталог
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {liveTours.length > 0 ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {liveTours.map((tour) => (
            <li key={tour.slug}>
              <MarketplaceTourCard tour={tour} />
            </li>
          ))}
        </ul>
      ) : null}

      <ul className={cn("grid gap-3 sm:grid-cols-2", liveTours.length > 0 ? "mt-5" : "mt-5")}>
        {FEATURED_TOUR_LINKS.map((item) => (
          <li key={item.query}>
            <Link
              href={`/tours?query=${encodeURIComponent(item.query)}`}
              className="group flex min-h-[44px] items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-sky/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
                <Compass className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-sm font-bold text-charcoal group-hover:text-sky sm:text-base">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate">{item.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
