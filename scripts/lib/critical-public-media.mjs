export const DEFAULT_CRITICAL_MEDIA_BUDGET_BYTES = 650 * 1024;
export const MOBILE_DERIVATIVE_BUDGET_BYTES = 260 * 1024;
export const DEFAULT_CRITICAL_MEDIA_MAX_EDGE = 1920;

/**
 * Images reached by the public mobile smoke/Lighthouse routes without Vercel's
 * metered image optimizer. Keep the source paths usable as a safe fallback,
 * even when a page also owns a smaller WebP derivative.
 */
export const CRITICAL_PUBLIC_MEDIA = Object.freeze([
  { path: "media/home/hero.jpg", maxBytes: 700 * 1024 },
  { path: "media/destinations/ba/section.jpg", maxBytes: 650 * 1024 },
  { path: "media/destinations/bariloche/section.jpg", quality: 68 },
  { path: "media/destinations/calafate/section.jpg" },
  { path: "media/destinations/ushuaia/section.jpg" },
  { path: "media/destinations/iguazu/section.jpg" },
  { path: "media/destinations/mendoza/section.jpg" },
  { path: "media/destinations/salta/section.jpg", maxBytes: 700 * 1024 },
  { path: "media/destinations/patagonia/section.jpg" },
  { path: "media/destinations/patagonia/cover.jpg" },
  { path: "media/destinations/patagonia/gallery-1.jpg" },
  { path: "media/destinations/patagonia/gallery-2.jpg" },
  { path: "media/destinations/patagonia/gallery-3.jpg" },
  { path: "media/services/blog/hero.jpg" },
  { path: "media/services/contacts/hero.jpg" },
  {
    path: "media/placeholders/tour-card.jpg",
    maxBytes: 260 * 1024,
    maxEdge: 1600,
    manifestRequired: false,
  },
]);

export function isMobileDerivative(relativePath) {
  return /(?:-|\/)(?:mobile|card|lcp)(?:-[a-z0-9]+)?\.(?:avif|webp|jpe?g)$/i.test(relativePath);
}

export function mediaBudgetFor(entry) {
  return entry.maxBytes ?? DEFAULT_CRITICAL_MEDIA_BUDGET_BYTES;
}
