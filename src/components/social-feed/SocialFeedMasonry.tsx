"use client";

import { SocialFeedTile } from "@/components/social-feed/SocialFeedTile";
import { cn } from "@/lib/cn";
import type { SocialFeedItem, SocialFeedSource } from "@/lib/social-feed/types";

type SocialFeedMasonryProps = {
  items: SocialFeedItem[];
  sourcesById: Map<string, SocialFeedSource>;
  className?: string;
};

export default function SocialFeedMasonry({
  items,
  sourcesById,
  className,
}: SocialFeedMasonryProps) {
  return (
    <div className={cn("columns-2 gap-3 sm:columns-3 lg:columns-4", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="mb-3 break-inside-avoid">
          <SocialFeedTile
            item={item}
            source={sourcesById.get(item.sourceId)}
            priority={index < 2}
            className={index % 3 === 0 ? "[&_a]:aspect-[3/4]" : undefined}
          />
        </div>
      ))}
    </div>
  );
}
