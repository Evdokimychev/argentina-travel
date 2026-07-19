"use client";

import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import SectionShell from "@/components/layout/SectionShell";
import SocialFeedCarousel from "@/components/social-feed/SocialFeedCarousel";
import SocialFeedMasonry from "@/components/social-feed/SocialFeedMasonry";
import { SocialFeedTile } from "@/components/social-feed/SocialFeedTile";
import { cn } from "@/lib/cn";
import type {
  SocialFeedItem,
  SocialFeedLayout,
  SocialFeedSource,
  SocialFeedTopic,
} from "@/lib/social-feed/types";

export type SocialFeedBlockProps = {
  items: SocialFeedItem[];
  topics: SocialFeedTopic[];
  sources: SocialFeedSource[];
  primarySource: SocialFeedSource | null;
  usedGalleryFallback?: boolean;
  layout?: SocialFeedLayout;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  profileUrl?: string;
  className?: string;
  compact?: boolean;
};

export default function SocialFeedBlock({
  items,
  topics,
  sources,
  primarySource,
  usedGalleryFallback = false,
  layout = "carousel",
  title,
  subtitle,
  eyebrow,
  profileUrl,
  className,
  compact = false,
}: SocialFeedBlockProps) {
  if (items.length === 0) return null;

  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const topicLabel = topics[0]?.labelRu;
  const resolvedTitle =
    title ??
    (topicLabel ? `${topicLabel} в Instagram` : "Аргентина в Instagram");
  const resolvedSubtitle =
    subtitle ??
    (usedGalleryFallback
      ? "Подборка вдохновляющих кадров — после синхронизации Instagram здесь появятся живые публикации."
      : primarySource
        ? `Живые кадры от @${primarySource.handle} и curated-источников`
        : "Живые кадры и короткие истории из поездок");
  const resolvedEyebrow = eyebrow ?? (primarySource ? `@${primarySource.handle}` : "Instagram");
  const resolvedProfile = profileUrl ?? primarySource?.profileUrl;

  const gridItems = items.slice(0, compact ? 6 : 8);

  return (
    <SectionShell
      reveal
      eyebrow={resolvedEyebrow}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      className={cn(compact ? "py-10 sm:py-12" : "py-12 sm:py-16", className)}
      actions={
        resolvedProfile ? (
          <Link
            href={resolvedProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:border-sky/30 hover:text-sky"
          >
            <Camera className="h-4 w-4" aria-hidden />
            Подписаться
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
          </Link>
        ) : undefined
      }
    >
      {layout === "carousel" ? (
        <SocialFeedCarousel items={items} sourcesById={sourcesById} />
      ) : null}

      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gridItems.map((item) => (
            <SocialFeedTile
              key={item.id}
              item={item}
              source={sourcesById.get(item.sourceId)}
            />
          ))}
        </div>
      ) : null}

      {layout === "masonry" ? (
        <SocialFeedMasonry items={items} sourcesById={sourcesById} />
      ) : null}
    </SectionShell>
  );
}
