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

  const width = Math.min(1800, Math.max(160, Math.round(options.width ?? 1440)));
  const quality = Math.min(90, Math.max(55, Math.round(options.quality ?? 80)));

  // Prefer the partner CDN's own width transform. Original tour photos can be
  // several megabytes, which is especially expensive on mobile. Keeping the
  // transformation on the trusted source also avoids Vercel image/proxy quotas.
  if (process.env.NEXT_PUBLIC_PARTNER_IMAGE_PROXY !== "true") {
    const url = new URL(src);
    url.pathname = `/tr:w-${width}${url.pathname}`;
    return url.toString();
  }

  const params = new URLSearchParams({ src, w: String(width), q: String(quality) });
  return `/api/media/partner-image?${params.toString()}`;
}
