import type { KbMedia, KbMediaImage } from "./types";

/** Hero first, followed by gallery items with duplicate URLs removed. */
export function resolveKbMediaImages(media: KbMedia): KbMediaImage[] {
  const byUrl = new Map<string, KbMediaImage>();
  for (const image of [media.hero, ...(media.gallery ?? [])]) {
    if (!image?.url || byUrl.has(image.url)) continue;
    byUrl.set(image.url, image);
  }
  return [...byUrl.values()];
}
