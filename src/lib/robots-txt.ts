import { absoluteUrl } from "@/lib/site-url";

const CANONICAL_INDEXING_HOST = "www.goargentina.ru";

type SearchIndexingEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, "NODE_ENV" | "VERCEL_ENV" | "DEPLOY_ENV">
>;

/**
 * Only the canonical production host may be indexed. This keeps Vercel previews,
 * staging deployments and local production previews out of search results even
 * when they read `allowIndexing: true` from the production CMS.
 */
export function isCanonicalIndexingRequest(
  requestUrl: string,
  env: SearchIndexingEnvironment = process.env,
): boolean {
  let hostname: string;
  try {
    hostname = new URL(requestUrl).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (hostname !== CANONICAL_INDEXING_HOST) return false;

  const deploymentEnvironment = env.VERCEL_ENV ?? env.DEPLOY_ENV;
  if (deploymentEnvironment) return deploymentEnvironment === "production";
  return env.NODE_ENV === "production";
}

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
  "/baza-znaniy/poisk",
  "/api/",
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
