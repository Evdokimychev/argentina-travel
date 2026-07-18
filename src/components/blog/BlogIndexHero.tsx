import HubHero from "@/components/guide/hub/HubHero";
import { BLOG_HERO_COPY, type BlogHeroVariant } from "@/lib/blog-hero-variant";

type BlogIndexHeroProps = {
  variant: BlogHeroVariant;
  indexablePostsCount: number;
};

/** Server-rendered blog index hero — stable LCP, no client A/B flash. */
export default function BlogIndexHero({ variant, indexablePostsCount }: BlogIndexHeroProps) {
  const copy = BLOG_HERO_COPY[variant];

  return (
    <HubHero
      title="Блог о путешествиях"
      subtitle={
        variant === "b"
          ? copy.subtitle
          : `${indexablePostsCount.toLocaleString("ru-RU")} проверенных материалов — ${copy.subtitle}`
      }
      image="/media/services/blog/hero-mobile.webp"
      imageAlt="Анды на рассвете — журнал о путешествиях по Аргентине"
      theme="journal"
      eyebrow={{ label: "Журнал", href: "/blog" }}
      ctas={
        variant === "b"
          ? [
              { label: copy.primaryCta, href: "/podbor", variant: "primary" as const },
              { label: copy.secondaryCta, href: "/blog#blog-search", variant: "secondary" as const },
            ]
          : [
              { label: copy.secondaryCta, href: "/guide", variant: "secondary" as const },
              { label: copy.primaryCta, href: "/places", variant: "primary" as const },
            ]
      }
    />
  );
}
