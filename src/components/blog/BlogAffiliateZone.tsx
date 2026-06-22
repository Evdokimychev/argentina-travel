"use client";

import Link from "next/link";
import { Car, Shield, Smartphone } from "lucide-react";
import BlogAffiliateEmbed from "@/components/blog/BlogAffiliateEmbed";
import { resolveBlogAffiliateCards, type BlogAffiliateService } from "@/lib/blog-affiliate-zones";
import { resolveBlogAffiliateEmbedForPost } from "@/lib/blog-affiliate-embeds";
import { withBlogAffiliateAttribution } from "@/lib/blog-affiliate-attribution";
import { trackBlogAffiliateClick } from "@/lib/analytics/gtm-events";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

const SERVICE_ICONS: Record<BlogAffiliateService, typeof Car> = {
  "car-rental": Car,
  insurance: Shield,
  esim: Smartphone,
};

type BlogAffiliateZoneProps = {
  post: BlogPost;
  className?: string;
};

export default function BlogAffiliateZone({ post, className }: BlogAffiliateZoneProps) {
  const cards = resolveBlogAffiliateCards(post);
  const embed = resolveBlogAffiliateEmbedForPost({
    category: post.category,
    tags: post.tags,
  });
  const cardsWithoutEmbed = embed
    ? cards.filter((card) => card.service !== embed.service)
    : cards;

  if (cardsWithoutEmbed.length === 0 && !embed?.embedUrl) return null;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 sm:p-5",
        className,
      )}
      aria-label="Полезные сервисы для поездки"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate">Сервисы для поездки</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate/80">
        Партнёрские сервисы платформы — переход без дополнительной стоимости для вас
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {cardsWithoutEmbed.map((card) => {
          const Icon = SERVICE_ICONS[card.service];
          return (
            <li key={card.service}>
              <Link
                href={withBlogAffiliateAttribution(card.href, {
                  postSlug: post.slug,
                  service: card.service,
                })}
                onClick={() =>
                  trackBlogAffiliateClick({
                    slug: post.slug,
                    service: card.service,
                    href: card.href,
                  })
                }
                className="group flex h-full flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-sky/25 hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky/10 text-sky">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="mt-3 font-heading text-sm font-bold text-charcoal group-hover:text-sky">
                  {card.title}
                </span>
                <span className="mt-1 flex-1 text-xs leading-relaxed text-slate">{card.description}</span>
                <span className="mt-3 text-xs font-semibold text-sky">{card.ctaLabel} →</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {embed?.embedUrl ? (
        <BlogAffiliateEmbed
          category={post.category}
          tags={post.tags}
          postSlug={post.slug}
          className="mt-3"
        />
      ) : null}
    </aside>
  );
}
