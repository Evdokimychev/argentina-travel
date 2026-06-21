"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  ExternalLink,
  MapPin,
  Mountain,
  Star,
} from "lucide-react";
import BlogCallout from "@/components/blog/BlogCallout";
import BlogContentTable from "@/components/blog/BlogContentTable";
import BlogFaqSection from "@/components/blog/BlogFaqSection";
import BlogMapBlock from "@/components/blog/BlogMapBlock";
import BlogSeasonWidget from "@/components/blog/BlogSeasonWidget";
import BlogTicketLink from "@/components/blog/BlogTicketLink";
import { BlogRichGalleryCarousel } from "@/components/blog/BlogRichGalleryCarousel";
import PageImage from "@/components/media/PageImage";
import { cn } from "@/lib/cn";
import { getContentImage, getRichArticleGallery } from "@/lib/media-resolver";
import { siteScrollAnchorClass } from "@/lib/site-container";
import type {
  BlogRichArticle,
  BlogRichBlock,
  BlogRichCalloutVariant,
  BlogRichSpot,
} from "@/types/blog-rich-article";
import type { BlogCalloutVariant } from "@/types/blog-content-blocks";

function mapRichCalloutVariant(variant: BlogRichCalloutVariant): BlogCalloutVariant {
  if (variant === "info") return "know";
  return variant;
}

function RichStatsGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-sky/[0.03] p-4 shadow-sm"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate/80">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-sm font-medium leading-snug text-charcoal">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RichLinks({
  title,
  items,
}: {
  title?: string;
  items: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      {title ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate/80">
          {title}
        </p>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky hover:underline"
              >
                {item.label}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </a>
            ) : (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky hover:underline"
              >
                {item.label}
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RichSpotCard({ spot }: { spot: BlogRichSpot }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold text-white">
          {spot.rank}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-bold text-charcoal sm:text-lg">{spot.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">{spot.why}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-slate">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {spot.duration}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-slate">
              <Mountain className="h-3.5 w-3.5" aria-hidden />
              {spot.difficulty}
            </span>
          </div>
          <p className="mt-3 rounded-xl bg-sky/[0.05] px-3 py-2 text-xs leading-relaxed text-charcoal/90">
            <span className="font-semibold text-sky-dark">Совет: </span>
            {spot.tip}
          </p>
        </div>
      </div>
    </article>
  );
}

function RichTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: string[][];
  caption?: string;
}) {
  return <BlogContentTable headers={headers} rows={rows} caption={caption} />;
}

function RichFaqList({ items }: { items: Array<{ question: string; answer: string }> }) {
  return <BlogFaqSection items={items} />;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} из 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < value ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function RichRatings({
  items,
  audience,
  note,
}: {
  items: Array<{ label: string; stars: number }>;
  audience: string[];
  note?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm font-medium text-charcoal">{item.label}</span>
            <StarRating value={item.stars} />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-sky/15 bg-sky/[0.04] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-dark">Кому подойдёт</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {audience.map((item) => (
            <li
              key={item}
              className="rounded-full border border-sky/15 bg-white px-3 py-1.5 text-xs font-medium text-charcoal"
            >
              {item}
            </li>
          ))}
        </ul>
        {note ? <p className="mt-3 text-xs leading-relaxed text-slate">{note}</p> : null}
      </div>
    </div>
  );
}

function RichMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return <BlogMapBlock lat={lat} lng={lng} label={label} />;
}

function RichTicketLink({ url, label }: { url: string; label: string }) {
  return <BlogTicketLink url={url} label={label} />;
}

function RichBlock({ block, articleId }: { block: BlogRichBlock; articleId: string }) {
  switch (block.type) {
    case "paragraphs":
      return (
        <div className="space-y-4">
          {block.items.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="leading-relaxed text-slate">
              {paragraph}
            </p>
          ))}
        </div>
      );
    case "callout":
      return (
        <BlogCallout
          variant={mapRichCalloutVariant(block.variant)}
          title={block.title}
          body={block.body}
        />
      );
    case "stats":
      return <RichStatsGrid items={block.items} />;
    case "links":
      return <RichLinks title={block.title} items={block.items} />;
    case "spots":
      return (
        <div className="grid gap-4">
          {block.items.map((spot) => (
            <RichSpotCard key={spot.rank} spot={spot} />
          ))}
        </div>
      );
    case "table":
      return <RichTable headers={block.headers} rows={block.rows} caption={block.caption} />;
    case "bullets":
      return (
        <div>
          {block.title ? (
            <h3 className="mb-2 font-heading text-base font-semibold text-charcoal">{block.title}</h3>
          ) : null}
          <ul className="list-disc space-y-2 pl-5 text-slate">
            {block.items.map((item) => (
              <li key={item.slice(0, 48)} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "seasons":
      return (
        <BlogSeasonWidget items={block.items} conclusion={block.conclusion} />
      );
    case "faq":
      return <RichFaqList items={block.items} />;
    case "ratings":
      return (
        <RichRatings items={block.items} audience={block.audience} note={block.note} />
      );
    case "numbered-tips":
      return (
        <ol className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          {block.items.map((item, index) => (
            <li key={item.slice(0, 40)} className="flex gap-3 text-sm leading-relaxed text-slate">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky/10 text-xs font-bold text-sky">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "gallery":
      return (
        <BlogRichGalleryCarousel
          images={block.images.map((image) => ({
            src: image.src,
            alt: image.alt,
            caption: image.title,
          }))}
          ariaLabel="Галерея в статье"
        />
      );
    case "section-image": {
      const image = block.slotId
        ? getContentImage(`rich:${articleId}`, `section-${block.slotId}`)
        : block.src;
      if (!image) return null;
      return (
        <figure className="mx-auto max-w-prose overflow-hidden rounded-2xl bg-charcoal/5 ring-1 ring-gray-100">
          <div className="relative aspect-[16/10] w-full">
            <PageImage
              image={image}
              role="section"
              fill
              className="object-cover"
            />
          </div>
          {block.caption ? (
            <figcaption className="px-4 py-3 text-sm text-slate">{block.caption}</figcaption>
          ) : (
            <figcaption className="sr-only">{block.alt}</figcaption>
          )}
        </figure>
      );
    }
    case "map":
      return <RichMap lat={block.lat} lng={block.lng} label={block.label} />;
    case "ticket-link":
      return <RichTicketLink url={block.url} label={block.label} />;
    default:
      return null;
  }
}

export default function BlogRichArticle({
  article,
  galleryImages,
}: {
  article: BlogRichArticle;
  galleryImages?: Array<{ src: string; alt: string }>;
}) {
  const gallery = galleryImages ?? getRichArticleGallery(article.id);

  return (
    <div className="space-y-10">
      {gallery.length > 0 ? (
        <BlogRichGalleryCarousel
          images={gallery}
          ariaLabel="Фотогалерея национального парка"
        />
      ) : null}

      <div className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.07] via-white to-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
          <div>
            <p className="text-base leading-relaxed text-charcoal">{article.lede}</p>
            {article.intro?.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="mt-4 text-base leading-relaxed text-charcoal">
                {paragraph}
              </p>
            ))}
            {article.updatedLabel ? (
              <p className="mt-3 text-xs leading-relaxed text-slate">{article.updatedLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      {article.sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-5">
          <h2
            className={cn(
              "font-heading text-xl font-bold text-charcoal sm:text-2xl",
              siteScrollAnchorClass
            )}
          >
            {section.title}
          </h2>
          <div className="space-y-5">
            {section.blocks.map((block, index) => (
              <RichBlock key={`${section.id}-${index}`} block={block} articleId={article.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
