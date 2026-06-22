import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getBlogCategoryTourCta } from "@/data/blog-category-tours";
import { SITE_WHATSAPP_URL } from "@/data/site-contacts";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogEngagementCtaProps = {
  post: BlogPost;
  className?: string;
};

export default function BlogEngagementCta({ post, className }: BlogEngagementCtaProps) {
  const tourCta = getBlogCategoryTourCta(post.category);
  const hasTourEmbeds = Boolean(post.tourEmbeds?.length);

  return (
    <section
      className={cn(
        "rounded-3xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-6 text-center shadow-card sm:p-8",
        className,
      )}
      aria-labelledby="blog-engagement-cta-title"
    >
      <p id="blog-engagement-cta-title" className="font-heading text-xl font-bold text-charcoal">
        Планируете поездку?
      </p>
      <p className="mt-2 text-sm text-slate">
        {hasTourEmbeds
          ? "Дополните маршрут материалами путеводителя или напишите нам — поможем собрать поездку"
          : "Соберите маршрут в путеводителе, выберите тур по теме или задайте вопрос в WhatsApp"}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {!hasTourEmbeds ? (
          <Link
            href={`/tours?query=${encodeURIComponent(tourCta.query)}`}
            className={cn(buttonVariants(), "rounded-full px-6")}
          >
            {tourCta.title}
          </Link>
        ) : null}
        <Link href="/guide" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}>
          Путеводитель
        </Link>
        <Link
          href={SITE_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex items-center gap-2 rounded-full px-6",
          )}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp
        </Link>
        <Link href="/contacts" className={cn(buttonVariants({ variant: "ghost" }), "rounded-full px-6")}>
          Консультация
        </Link>
      </div>
      {!hasTourEmbeds ? (
        <p className="mt-3 text-xs text-slate">{tourCta.subtitle}</p>
      ) : null}
    </section>
  );
}
