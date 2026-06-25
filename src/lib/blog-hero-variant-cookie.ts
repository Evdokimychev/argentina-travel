import type { BlogHeroVariant } from "@/lib/blog-hero-variant";
import { resolveBlogHeroVariant } from "@/lib/blog-hero-variant";

export const BLOG_HERO_VARIANT_COOKIE = "ga-blog-hero-variant";

/** Resolve A/B variant from cookie; assign pseudo-random default when missing. */
export function resolveBlogHeroVariantFromCookie(
  stored: string | undefined,
  seed?: string,
): BlogHeroVariant {
  if (stored === "a" || stored === "b") return stored;
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 2 === 0 ? "a" : "b";
  }
  return resolveBlogHeroVariant(null);
}
