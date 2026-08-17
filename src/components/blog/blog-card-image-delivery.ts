/**
 * Blog listing image delivery for the unoptimized Vercel image pipeline.
 *
 * Production disables next/image resizing after optimizer quota spend, so card
 * surfaces must request committed card/mobile derivatives instead of multi‑MB
 * hero originals.
 */

const ALREADY_DERIVATIVE =
  /(?:-|\/)(?:mobile|card|lcp)(?:-[a-z0-9]+)?\.(?:avif|webp|jpe?g)$/i;

/** Compact editorial avatar used on BlogCard overlays (not a full article hero). */
export const BLOG_EDITORIAL_AVATAR_SRC = "/media/blog/editorial-avatar.webp";

/** Legacy editorial avatar path that accidentally pointed at a full hero JPEG. */
export const BLOG_EDITORIAL_AVATAR_LEGACY_SRC = "/media/blog/grazhdanstvo-argentiny/hero.jpg";

/**
 * Rewrite a blog/catalog cover URL to its committed `-card.webp` derivative.
 * Falls through unchanged for SVGs, already-compact derivatives, and non-raster paths.
 */
export function blogCardListingImage(src: string): string {
  const trimmed = src.trim();
  if (!trimmed) return trimmed;
  if (trimmed === BLOG_EDITORIAL_AVATAR_LEGACY_SRC || trimmed === BLOG_EDITORIAL_AVATAR_SRC) {
    return BLOG_EDITORIAL_AVATAR_SRC;
  }
  if (ALREADY_DERIVATIVE.test(trimmed)) return trimmed;
  if (/avatar(?:-[a-z0-9]+)?\.(?:avif|webp|jpe?g)$/i.test(trimmed)) return trimmed;
  if (!/\.(?:jpe?g|png|webp)$/i.test(trimmed)) return trimmed;
  return trimmed.replace(/\.(?:jpe?g|png|webp)$/i, "-card.webp");
}

/** Keep author chips from requesting multi‑MB heroes as 44px avatars. */
export function blogAuthorAvatarImage(src: string | undefined | null): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (!trimmed) return undefined;
  if (trimmed === BLOG_EDITORIAL_AVATAR_LEGACY_SRC || trimmed === BLOG_EDITORIAL_AVATAR_SRC) {
    return BLOG_EDITORIAL_AVATAR_SRC;
  }
  // Compact avatar files must not be rewritten to missing *-card.webp derivatives.
  if (/avatar(?:-[a-z0-9]+)?\.(?:avif|webp|jpe?g)$/i.test(trimmed)) {
    return trimmed;
  }
  return blogCardListingImage(trimmed);
}
