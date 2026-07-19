import {
  getPrimaryInstagramProfileUrl,
  getSocialFeed,
  resolveSocialFeedDisplay,
} from "@/lib/social-feed/get-feed";
import SocialFeedBlock from "@/components/social-feed/SocialFeedBlock";
import type { SocialFeedLayout } from "@/lib/social-feed/types";

const PUBLIC_SOCIAL_FEED_WAIT_MS = 2_500;

export type SocialFeedProps = {
  /** Ключ размещения: home, about, destination:ba, place:bariloche, kb:slug */
  placement?: string;
  /** Явный список source id — приоритетнее placement */
  sources?: string[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  layout?: SocialFeedLayout;
  limit?: number;
  minItems?: number;
  compact?: boolean;
  className?: string;
};

async function loadSocialFeedBlock({
  placement,
  sources,
  title,
  subtitle,
  eyebrow,
  layout,
  limit,
  minItems,
  compact,
  className,
}: SocialFeedProps) {
  const feed = await getSocialFeed({ placement, sources, limit });
  const display = resolveSocialFeedDisplay(
    { placement, sources, title, subtitle, eyebrow, layout, limit, minItems },
    feed,
  );

  if (feed.items.length < (display.minItems ?? 3)) return null;

  const profileUrl = await getPrimaryInstagramProfileUrl();

  return (
    <SocialFeedBlock
      items={feed.items}
      topics={feed.topics}
      sources={feed.sources}
      primarySource={feed.primarySource}
      usedGalleryFallback={feed.usedGalleryFallback}
      layout={display.layout}
      title={display.title}
      subtitle={display.subtitle}
      eyebrow={display.eyebrow}
      profileUrl={profileUrl}
      compact={compact}
      className={className}
    />
  );
}

async function SocialFeedContent(props: SocialFeedProps) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), PUBLIC_SOCIAL_FEED_WAIT_MS);
  });

  try {
    return await Promise.race([loadSocialFeedBlock(props), deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Социальная лента не удерживает основной публичный контент при сбое источника. */
export default function SocialFeed(props: SocialFeedProps) {
  return (
    <Suspense fallback={null}>
      <SocialFeedContent {...props} />
    </Suspense>
  );
}
import { Suspense } from "react";
