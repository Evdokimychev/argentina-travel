const SUPABASE_HOST_SUFFIXES = [".supabase.co", ".supabase.in"] as const;

const CMS_MEDIA_PUBLIC_PREFIX = /\/storage\/v1\/object\/public\/cms-media\/(.+)/i;
const REVIEW_PHOTO_PUBLIC_PREFIX = /\/storage\/v1\/object\/public\/tourist-review-photos\/(.+)/i;

/** Canonical CDN origin, e.g. https://goargentina.ru/site-media */
export function getMediaCdnOrigin(): string | null {
  // `next dev` always serves straight from the committed public/media copy.
  // New editorial photos/illustrations are typically previewed locally
  // before they're synced to the Reg.ru CDN (see
  // docs/ai-first/media-reg-ru-migration.md); rewriting to a CDN URL that
  // doesn't have the file yet turns every new image into a 404 during
  // local review. Preview/production builds (NODE_ENV=production) are
  // unaffected and still exercise the real CDN.
  if (process.env.NODE_ENV === "development") return null;

  const raw = process.env.NEXT_PUBLIC_MEDIA_CDN_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString().replace(/\/+$/, "");
  } catch {
    // A placeholder or incomplete hostname must never be prefixed to public
    // media paths. Falling back to the bundled copy keeps the page usable.
    return null;
  }
}

export function isExternalMediaCdnEnabled(): boolean {
  return Boolean(getMediaCdnOrigin());
}

function isSupabaseStorageHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return SUPABASE_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

function normalizeRelativeMediaPath(localPath: string): string {
  const normalized = localPath.trim().replace(/^\/+/, "");
  return normalized.startsWith("media/") ? normalized : `media/${normalized}`;
}

/** Rewrite legacy Supabase Storage URLs to the Reg.ru CDN when configured. */
export function rewriteLegacySupabaseMediaUrl(url: string): string {
  const origin = getMediaCdnOrigin();
  if (!origin) return url;

  try {
    const parsed = new URL(url);
    if (!isSupabaseStorageHostname(parsed.hostname)) return url;

    const cmsMatch = parsed.pathname.match(CMS_MEDIA_PUBLIC_PREFIX);
    if (cmsMatch?.[1]) {
      return `${origin}/${cmsMatch[1]}`;
    }

    const reviewMatch = parsed.pathname.match(REVIEW_PHOTO_PUBLIC_PREFIX);
    if (reviewMatch?.[1]) {
      return `${origin}/reviews/${reviewMatch[1]}`;
    }
  } catch {
    return url;
  }

  return url;
}

/** Public URL for manifest paths, CMS uploads, or already-absolute URLs. */
export function mediaUrl(localPath: string): string {
  const trimmed = localPath.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return rewriteLegacySupabaseMediaUrl(trimmed);
  }

  const origin = getMediaCdnOrigin();
  const path = normalizeRelativeMediaPath(trimmed);
  if (origin) {
    return `${origin}/${path}`;
  }

  return `/${path}`;
}

/** Public URL for a storage object path on the external CDN (CMS uploads). */
export function buildCmsStoragePublicUrl(storagePath: string): string {
  const normalized = storagePath.trim().replace(/^\/+/, "");
  const origin = getMediaCdnOrigin();
  if (origin) {
    return `${origin}/${normalized}`;
  }
  return `/${normalized}`;
}

/** Public URL for a review photo storage path. */
export function buildReviewPhotoPublicUrl(storagePath: string): string {
  const normalized = storagePath.trim().replace(/^\/+/, "");
  const origin = getMediaCdnOrigin();
  if (origin) {
    return `${origin}/reviews/${normalized}`;
  }
  return `/reviews/${normalized}`;
}
