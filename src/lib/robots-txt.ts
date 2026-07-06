import { absoluteUrl } from "@/lib/site-url";

/** Paths closed from indexing (aligned with legacy robots.ts). */
export const ROBOTS_DISALLOW_PATHS = [
  "/admin/",
  "/organizer/",
  "/profile/",
  "/booking/pay/",
  "/booking/travelers/",
  "/trip/",
  "/auth/",
  "/embed/",
  "/dev/",
] as const;

/**
 * Tracking / session params that do not change page content (Yandex Clean-param).
 * @see https://yandex.ru/support/webmaster/ru/robot-workings/clean-param.html
 */
export const YANDEX_CLEAN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_referrer",
  "utm_media",
  "utm_group",
  "utm_expid",
  "gclid",
  "fbclid",
  "yclid",
  "ysclid",
  "yrclid",
  "_openstat",
  "from",
  "ref",
].join("&");

export function buildRobotsTxtBody(allowIndexing: boolean): string {
  if (!allowIndexing) {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }

  const disallowLines = ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`);
  const sitemapUrl = absoluteUrl("/sitemap.xml");

  return [
    "User-agent: *",
    "Allow: /",
    ...disallowLines,
    "",
    "User-agent: Yandex",
    "Allow: /",
    ...disallowLines,
    `Clean-param: ${YANDEX_CLEAN_PARAMS}`,
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");
}
