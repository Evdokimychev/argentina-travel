import { rewriteLegacySupabaseMediaUrl } from "@/lib/media/media-cdn";

const SUPABASE_HOST_SUFFIXES = [".supabase.co", ".supabase.in"] as const;
const SUPABASE_STORAGE_PREFIX = "/storage/v1/";
const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/";
const SIGNED_OBJECT_PREFIX = "/storage/v1/object/sign/";
const PUBLIC_RENDER_PREFIX = "/storage/v1/render/image/public/";
const SIGNED_RENDER_PREFIX = "/storage/v1/render/image/sign/";
const DEFAULT_IMAGE_QUALITY = 78;

export type SupabaseCdnOptions = {
  width?: number;
  quality?: number;
};

function normalizeInteger(value: number, min: number, max: number): number | null {
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < min) return null;
  return Math.min(rounded, max);
}

function isSupabaseStorageHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return SUPABASE_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

function upgradeToRenderPath(pathname: string): string {
  if (pathname.startsWith(PUBLIC_OBJECT_PREFIX)) {
    return pathname.replace(PUBLIC_OBJECT_PREFIX, PUBLIC_RENDER_PREFIX);
  }
  if (pathname.startsWith(SIGNED_OBJECT_PREFIX)) {
    return pathname.replace(SIGNED_OBJECT_PREFIX, SIGNED_RENDER_PREFIX);
  }
  return pathname;
}

export function buildSupabaseCdnUrl(src: string, options: SupabaseCdnOptions = {}): string {
  const input = src.trim();
  if (!input || !/^https?:\/\//i.test(input)) return src;

  const rewritten = rewriteLegacySupabaseMediaUrl(input);

  let url: URL;
  try {
    url = new URL(rewritten);
  } catch {
    return src;
  }

  // Reg.ru / external CDN — no Supabase image transform API; next/image handles resize.
  if (!isSupabaseStorageHostname(url.hostname)) return rewritten;
  if (!url.pathname.startsWith(SUPABASE_STORAGE_PREFIX)) return rewritten;

  url.pathname = upgradeToRenderPath(url.pathname);

  const width = options.width == null ? null : normalizeInteger(options.width, 16, 4096);
  if (width) {
    url.searchParams.set("width", String(width));
  }

  const qualityInput =
    options.quality != null ? options.quality : (url.searchParams.has("quality") ? null : DEFAULT_IMAGE_QUALITY);
  const quality =
    qualityInput == null ? null : normalizeInteger(qualityInput, 20, 100);
  if (quality) {
    url.searchParams.set("quality", String(quality));
  }

  return url.toString();
}
