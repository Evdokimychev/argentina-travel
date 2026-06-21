import type { Metadata } from "next";
import type { SiteSeoGlobal } from "@/types/site-globals";
import { getGtmPublicConfig } from "@/lib/analytics/gtm-config";

export function resolveSiteVerificationMeta(seo: SiteSeoGlobal): Metadata["verification"] {
  const env = getGtmPublicConfig();
  const google = seo.googleSiteVerification?.trim() || env.googleSiteVerification;
  const bing = seo.bingSiteVerification?.trim() || env.bingSiteVerification;
  const ahrefs = seo.ahrefsSiteVerification?.trim() || env.ahrefsSiteVerification;

  const other: Record<string, string> = {};
  if (bing) other["msvalidate.01"] = bing;
  if (ahrefs) other["ahrefs-site-verification"] = ahrefs;

  if (!google && Object.keys(other).length === 0) return undefined;

  return {
    ...(google ? { google } : {}),
    ...(Object.keys(other).length > 0 ? { other } : {}),
  };
}
