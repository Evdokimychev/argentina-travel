const YOUTRAVEL_IMAGE_HOSTS = new Set(["cf.youtravel.me"]);
const YOUTRAVEL_IMAGE_PATH = /^\/(?:public\/images|upload|images)\//i;

export function isAllowedPartnerImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      YOUTRAVEL_IMAGE_HOSTS.has(url.hostname.toLowerCase()) &&
      YOUTRAVEL_IMAGE_PATH.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function buildPartnerImageProxyUrl(
  src: string,
  options: { width?: number; quality?: number } = {},
): string {
  if (!isAllowedPartnerImageUrl(src)) return src;

  // The partner CDN is safe for direct <img> delivery. Keep the server proxy
  // as an explicit fallback only: some Vercel runtimes cannot initialize its
  // native image transformer and would turn otherwise valid photos into 500s.
  if (process.env.NEXT_PUBLIC_PARTNER_IMAGE_PROXY !== "true") return src;

  const width = Math.min(1800, Math.max(160, Math.round(options.width ?? 1440)));
  const quality = Math.min(90, Math.max(55, Math.round(options.quality ?? 80)));
  const params = new URLSearchParams({ src, w: String(width), q: String(quality) });
  return `/api/media/partner-image?${params.toString()}`;
}
